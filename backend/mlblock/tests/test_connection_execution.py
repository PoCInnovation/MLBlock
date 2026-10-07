"""Theory vs practice: a connection verdict is only half the story.

test_type_system.py / test_connection_matrix.py prove that classify()/validate()
say the right thing. Here we go one step further and actually *execute* real
blocks chained together (via BlockRegistry.get(...).execute, same seam as
test_block.py::test_tsne_visualization) to prove that a 'compatible' or
'convertible' verdict really produces a runnable pipeline — and that an
'incompatible' pair never gets the chance to run at all.
"""
from __future__ import annotations

import numpy as np
import pandas as pd
import pytest
import torch
from torch import nn

from mlblock.core.block import BlockRegistry
from mlblock.core.type_system import type_system
from mlblock.validation import validate


def _exec(block_name: str, **params):
    meta = BlockRegistry.get(block_name)
    assert meta is not None, f"bloc '{block_name}' introuvable dans le registre d'exécution"
    return meta.execute(params)


# ── compatible: même famille, exécution réelle ─────────────────────────


def test_df_to_df_chain_runs_for_real(tmp_path) -> None:
    csv_path = tmp_path / "data.csv"
    csv_path.write_text("x,y\n1.0,10.0\n2.0,20.0\n3.0,30.0\n")

    df = _exec("load_csv", path=str(csv_path))
    assert isinstance(df, pd.DataFrame)

    scaled = _exec("standard_scaler", in_1=df)
    assert isinstance(scaled, pd.DataFrame)
    assert list(scaled.columns) == ["x", "y"]
    # standardized columns have ~0 mean
    assert abs(scaled["x"].mean()) < 1e-9


def test_text_pipeline_list_and_dict_chain_runs_for_real() -> None:
    tokens = _exec("tokenize", text="Bonjour le Monde, bonjour!")
    assert tokens == ["bonjour", "le", "monde", "bonjour"]

    vocab = _exec("build_vocab", in_1=tokens)
    assert isinstance(vocab, dict)
    assert set(vocab) == {"bonjour", "le", "monde"}

    encoded = _exec("encode_text", in_1=tokens, vocab=vocab, max_len=8)
    assert isinstance(encoded, np.ndarray)
    assert encoded.shape == (8,)
    assert encoded[-1] == 0  # padding


def test_module_composition_chain_runs_for_real() -> None:
    linear = _exec("linear_layer", in_features=4, out_features=8, bias=True)
    with_relu = _exec("relu_layer", in_1=linear)
    with_flatten = _exec("flatten_layer", in_1=with_relu)
    assert isinstance(with_flatten, nn.Module)

    dummy = torch.randn(2, 4)
    out = with_flatten(dummy)
    assert out.shape == (2, 8)


def test_tensor_family_chain_runs_for_real(tmp_path) -> None:
    csv_path = tmp_path / "data.csv"
    csv_path.write_text("x,y\n1.0,0.0\n2.0,1.0\n3.0,0.0\n")
    df = _exec("load_csv", path=str(csv_path))

    features = _exec("df_to_tensor", in_1=df[["x"]])
    labels = _exec("df_to_tensor", in_1=df[["y"]])
    assert isinstance(features, torch.Tensor)

    activated = _exec("sigmoid", in_1=features)
    assert torch.all((activated >= 0) & (activated <= 1))

    dataset = _exec("tensor_dataset", in_1=features, in_2=labels)
    assert len(dataset) == 3


# ── convertible: validate() ne bloque PAS un edge "convertible" (seul
#    "incompatible" l'est — l'auto-insertion du convertisseur est une
#    préoccupation UX frontend, pas une garantie du backend) — mais
#    l'exécuter sans le convertisseur suggéré plante quand même ─────────


def test_convertible_is_not_blocked_but_fails_without_the_converter(tmp_path) -> None:
    from mlblock.catalog import catalog

    graph = type_system.build_conversion_graph(catalog.all())
    verdict = type_system.classify("pd.DataFrame", "torch.Tensor", graph)
    assert verdict == "convertible"
    conv = type_system.find_converter("pd.DataFrame", "torch.Tensor")
    assert conv == "df_to_tensor"

    csv_path = tmp_path / "data.csv"
    csv_path.write_text("x\n1.0\n2.0\n3.0\n")
    df = _exec("load_csv", path=str(csv_path))

    # validate() lets a "convertible" edge through untouched — only
    # "incompatible" raises a "Type mismatch" error (see validation.py's
    # dtype-compatibility loop, and the existing restricted-registry case in
    # test_validation.py::test_validate_type_mismatch_enhanced_suggestion).
    r = validate(
        [{"id": "csv", "type": "load_csv", "params": {}}, {"id": "act", "type": "sigmoid", "params": {}}],
        [{"source": "csv", "source_port": "out_1", "target": "act", "target_port": "in_1"}],
    )
    assert r.valid is True

    # ...yet running the raw connection for real without the converter
    # crashes: "convertible" means a fix exists, not that the connection
    # works as-is. This is the gap the ADR 0001 risk section warns about.
    with pytest.raises(Exception):
        _exec("sigmoid", in_1=df)

    # inserting the suggested converter is exactly what makes it run in practice
    tensor = _exec(conv, in_1=df)
    activated = _exec("sigmoid", in_1=tensor)
    assert isinstance(activated, torch.Tensor)


# ── incompatible: bloqué avant toute exécution ──────────────────────────


def test_incompatible_pair_is_blocked_before_execution() -> None:
    r = validate(
        [{"id": "q", "type": "q_learning", "params": {}}, {"id": "sc", "type": "standard_scaler", "params": {}}],
        [{"source": "q", "source_port": "out_1", "target": "sc", "target_port": "in_1"}],
    )
    assert r.valid is False
    assert any("Type mismatch" in e for e in r.errors)

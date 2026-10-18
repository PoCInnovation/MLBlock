from __future__ import annotations

from mlblock.catalog import catalog
from mlblock.core.type_system import TypeSystem, type_system
from mlblock.core.types import (
    VERDICT_COMPATIBLE,
    VERDICT_CONVERTIBLE,
    VERDICT_INCOMPATIBLE,
    classify as legacy_classify,
    family_of as legacy_family_of,
)


def test_type_system_family_of():
    assert type_system.family_of("pd.DataFrame") == "df"
    assert type_system.family_of("torch.Tensor") == "tensor"
    assert type_system.family_of("torch.nn.Module") == "module"
    assert type_system.family_of("PIL.Image.Image") == "image"
    assert type_system.family_of("numpy.ndarray") == "ndarray"
    assert type_system.family_of("Env") == "env"
    assert type_system.family_of("Policy") == "policy"
    # Matches legacy function
    assert type_system.family_of("pd.DataFrame") == legacy_family_of("pd.DataFrame")


def test_type_system_conversion_graph():
    graph = type_system.build_conversion_graph(catalog.all())
    assert "df" in graph
    assert "tensor" in graph["df"]
    assert "ndarray" in graph
    assert "tensor" in graph["ndarray"]


def test_type_system_classify():
    graph = type_system.build_conversion_graph(catalog.all())
    assert type_system.classify("torch.Tensor", "torch.Tensor", graph) == VERDICT_COMPATIBLE
    assert type_system.classify("pd.DataFrame", "object", graph) == VERDICT_COMPATIBLE
    assert type_system.classify("pd.DataFrame", "torch.Tensor", graph) == VERDICT_CONVERTIBLE
    assert type_system.classify("torch.Tensor", "pd.DataFrame", graph) == VERDICT_INCOMPATIBLE

    # Matches legacy function
    assert type_system.classify("pd.DataFrame", "torch.Tensor", graph) == legacy_classify(
        "pd.DataFrame", "torch.Tensor", graph
    )


def test_type_system_find_converter():
    assert type_system.find_converter("pd.DataFrame", "torch.Tensor") == "df_to_tensor"
    assert type_system.find_converter("numpy.ndarray", "torch.Tensor") == "to_tensor"
    assert type_system.find_converter("PIL.Image.Image", "torch.Tensor") == "to_tensor"
    assert type_system.find_converter("torch.Tensor", "pd.DataFrame") is None


def test_type_system_can_connect_compatible():
    verdict, msg = type_system.can_connect("torch.Tensor", "torch.Tensor")
    assert verdict == VERDICT_COMPATIBLE
    assert msg is None


def test_type_system_can_connect_convertible():
    verdict, msg = type_system.can_connect("pd.DataFrame", "torch.Tensor")
    assert verdict == VERDICT_CONVERTIBLE
    assert msg is not None
    assert "df_to_tensor" in msg

    # With block names
    verdict, msg = type_system.can_connect(
        "pd.DataFrame", "torch.Tensor", src_block="load_csv", tgt_block="linear_layer"
    )
    assert verdict == VERDICT_CONVERTIBLE
    assert "load_csv" in msg
    assert "linear_layer" in msg
    assert "df_to_tensor" in msg


def test_type_system_can_connect_incompatible():
    verdict, msg = type_system.can_connect("torch.Tensor", "pd.DataFrame")
    assert verdict == VERDICT_INCOMPATIBLE
    assert msg is not None
    assert "Type mismatch" in msg or "incompatible" in msg.lower()


def test_type_system_instance_independent():
    ts = TypeSystem()
    assert ts.family_of("int") == "scalar"

from __future__ import annotations

from mlblock.core.stages import (
    STAGE_METADATA,
    STAGE_NOTES,
    Stage,
    get_s2a_substate,
    stage_of_block,
    stage_of_category,
    stage_of_family,
)


def test_stage_enum_values_and_metadata():
    assert Stage.INGEST == 0
    assert Stage.PREPARE == 1
    assert Stage.REPRESENT == 2
    assert Stage.TRAIN == 3
    assert Stage.EVAL == 4
    assert Stage.WORLD == 9

    assert Stage.INGEST.stage_name == "Ingest"
    assert Stage.INGEST.label == "Données"
    assert Stage.INGEST.color == "#22C55E"

    assert Stage.PREPARE.stage_name == "Prepare"
    assert Stage.PREPARE.label == "Préparation"
    assert Stage.PREPARE.color == "#F5A623"

    assert Stage.REPRESENT.stage_name == "Represent"
    assert Stage.REPRESENT.label == "Modèle"
    assert Stage.REPRESENT.color == "#6366F1"

    assert Stage.TRAIN.stage_name == "Train"
    assert Stage.TRAIN.label == "Entraînement"
    assert Stage.TRAIN.color == "#DE497D"

    assert Stage.EVAL.stage_name == "Eval"
    assert Stage.EVAL.label == "Évaluation"
    assert Stage.EVAL.color == "#06B6D4"

    assert Stage.WORLD.stage_name == "World"
    assert Stage.WORLD.label == "Monde RL"
    assert Stage.WORLD.color == "#E8C77A"


def test_stage_aliases():
    assert Stage.REPRESENT_DL == Stage.REPRESENT
    assert Stage.REPRESENT_ML == Stage.REPRESENT
    assert Stage.TRAIN_DL == Stage.TRAIN
    assert Stage.TRAIN_ML == Stage.TRAIN


def test_stage_all_stages():
    stages = Stage.all_stages()
    assert len(stages) == 6
    assert stages == [
        Stage.INGEST,
        Stage.PREPARE,
        Stage.REPRESENT,
        Stage.TRAIN,
        Stage.EVAL,
        Stage.WORLD,
    ]
    for s in stages:
        assert s in STAGE_METADATA


def test_stage_of_category():
    assert stage_of_category("donnees") == Stage.INGEST
    assert stage_of_category("donnees-22C55E") == Stage.INGEST
    assert stage_of_category("chargement-7C3AED") == Stage.INGEST
    assert stage_of_category("transformations") == Stage.PREPARE
    assert stage_of_category("transformations-F5A623") == Stage.PREPARE
    assert stage_of_category("texte") == Stage.PREPARE
    assert stage_of_category("layers") == Stage.REPRESENT
    assert stage_of_category("layers-6366F1") == Stage.REPRESENT
    assert stage_of_category("activation") == Stage.REPRESENT
    assert stage_of_category("normalisation") == Stage.REPRESENT
    assert stage_of_category("regroupement") == Stage.REPRESENT
    assert stage_of_category("sequences") == Stage.REPRESENT
    assert stage_of_category("modeles") == Stage.REPRESENT
    assert stage_of_category("entrainement") == Stage.TRAIN
    assert stage_of_category("visualisation") == Stage.EVAL
    assert stage_of_category("renforcement") == Stage.WORLD
    assert stage_of_category("unknown_cat") == Stage.PREPARE


def test_stage_of_family():
    assert stage_of_family("df") == Stage.INGEST
    assert stage_of_family("image") == Stage.INGEST
    assert stage_of_family("ndarray") == Stage.INGEST
    assert stage_of_family("str") == Stage.INGEST
    assert stage_of_family("list") == Stage.INGEST
    assert stage_of_family("tensor") == Stage.PREPARE
    assert stage_of_family("tuple") == Stage.PREPARE
    assert stage_of_family("module") == Stage.REPRESENT
    assert stage_of_family("model") == Stage.REPRESENT
    assert stage_of_family("dataset") == Stage.TRAIN
    assert stage_of_family("optim") == Stage.TRAIN
    assert stage_of_family("dict") == Stage.TRAIN
    assert stage_of_family("scalar") == Stage.EVAL
    assert stage_of_family("env") == Stage.WORLD
    assert stage_of_family("policy") == Stage.WORLD
    assert stage_of_family("unknown") == Stage.PREPARE


def test_stage_of_block():
    # Overrides
    assert stage_of_block("evaluate") == Stage.EVAL
    assert stage_of_block("confusion_matrix") == Stage.EVAL
    assert stage_of_block("silhouette") == Stage.EVAL
    assert stage_of_block("plot_predictions") == Stage.EVAL

    # Category lookup
    assert stage_of_block("custom_block", category="entrainement") == Stage.TRAIN
    assert stage_of_block("custom_block", category="donnees-22C55E") == Stage.INGEST

    # Catalog resolution
    assert stage_of_block("load_csv") == Stage.INGEST
    assert stage_of_block("to_tensor") == Stage.PREPARE
    assert stage_of_block("conv2d_layer") == Stage.REPRESENT
    assert stage_of_block("adam") == Stage.TRAIN
    assert stage_of_block("create_env") == Stage.WORLD

    # Alias resolution
    assert stage_of_block("conv2d") == Stage.REPRESENT
    assert stage_of_block("linear") == Stage.REPRESENT


def test_s2a_substate_notes_and_classification():
    assert "S2A-CNN" in STAGE_NOTES
    assert "S2A-Seq" in STAGE_NOTES

    assert get_s2a_substate("conv2d_layer") == "S2A-CNN"
    assert get_s2a_substate("conv2d") == "S2A-CNN"
    assert get_s2a_substate("maxpool2d_layer") == "S2A-CNN"
    assert get_s2a_substate("avgpool2d") == "S2A-CNN"

    assert get_s2a_substate("lstm") == "S2A-Seq"
    assert get_s2a_substate("gru") == "S2A-Seq"
    assert get_s2a_substate("tokenize") == "S2A-Seq"
    assert get_s2a_substate("embedding") == "S2A-Seq"

    assert get_s2a_substate("load_csv") is None
    assert get_s2a_substate("linear_layer") is None

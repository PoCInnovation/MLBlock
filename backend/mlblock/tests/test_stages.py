from __future__ import annotations


def test_needs_cuda_true_for_pytorch_engine(monkeypatch):
    from mlblock.core import stages

    monkeypatch.setitem(stages.ENGINE_OF_BLOCK_OVERRIDES, "fake_torch_block", "pytorch")
    assert stages.needs_cuda([{"id": "n1", "type": "fake_torch_block", "children": []}]) is True


def test_needs_cuda_false_and_recursive(monkeypatch):
    from mlblock.core import stages

    assert stages.needs_cuda([]) is False
    assert stages.needs_cuda([{"id": "n1", "type": "bloc_inconnu_xyz", "children": []}]) is False
    assert (
        stages.needs_cuda(
            [{"id": "p", "type": "bloc_inconnu_xyz", "children": [{"id": "c", "type": "bloc_inconnu_xyz"}]}]
        )
        is False
    )
    monkeypatch.setitem(stages.ENGINE_OF_BLOCK_OVERRIDES, "fake_nested_torch", "pytorch")
    assert (
        stages.needs_cuda(
            [{"id": "p", "type": "bloc_inconnu_xyz", "children": [{"id": "c", "type": "fake_nested_torch"}]}]
        )
        is True
    )

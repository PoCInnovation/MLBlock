from pathlib import Path

import torch

from mlblock.models.cnn import build_cnn_from_config

CONFIG_PATH = Path("configs/cnn_mnist.json")


def main():
    print("=" * 60)
    print("Building model from config...")
    print("=" * 60)

    model = build_cnn_from_config(CONFIG_PATH)
    print(model)
    print()

    dummy = torch.randn(1, 1, 28, 28)
    output = model(dummy)
    print(f"Input shape:  {dummy.shape}")
    print(f"Output shape: {output.shape}")
    print(f"Output:       {output}")


if __name__ == "__main__":
    main()

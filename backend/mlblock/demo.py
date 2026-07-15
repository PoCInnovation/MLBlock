from pathlib import Path

from mlblock.models.cnn import generate_code_from_config

CONFIG_PATH = Path(__file__).parent / "configs" / "cnn_mnist.json"


def main():
    print("=" * 60)
    print("Generating code from config...")
    print("=" * 60)

    code = generate_code_from_config(CONFIG_PATH)
    print(code)

    output_path = Path("main.py")
    output_path.write_text(code)
    print(f"\nCode written to {output_path}")


if __name__ == "__main__":
    main()

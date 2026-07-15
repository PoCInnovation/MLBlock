def __getattr__(name):
    if name == "generate_code_from_config":
        from mlblock.models.cnn import generate_code_from_config
        return generate_code_from_config
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")

__all__ = ["generate_code_from_config"]

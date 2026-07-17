def code_block(code: "str", exec_location: "str" = 'inline') -> "Any":
    """Code personnalisé.
    
    Args:
        code: Parameter.
        exec_location: Parameter.
    """
    # Custom user code execution
    locs = {'inputs': inputs}
    exec(code, globals(), locs)
    return locs.get('outputs', None)

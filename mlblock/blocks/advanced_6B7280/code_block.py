def BUILD(params):
    code = params.get("code", "")
    if code:
        exec(code)
    return {}


BLOCK = {
    "label": "Code personnalisé",
    "category": "advanced",
    "params": {
        "code": {"type": "str", "required": True},
        "exec_location": {"type": "str", "default": "inline"},
    },
    "inputs": [],
    "outputs": [],
    "template": "{params.code}",
}

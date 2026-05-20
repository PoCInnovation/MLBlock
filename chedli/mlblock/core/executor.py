import subprocess
import sys


class PipelineExecutor:
    def run(self, main_py_path: str, timeout: int = 300) -> subprocess.CompletedProcess:
        result = subprocess.run(
            [sys.executable, main_py_path],
            capture_output=True,
            text=True,
            timeout=timeout,
        )
        return result

from __future__ import annotations

import subprocess
import sys


def run(cmd: list[str]) -> int:
    print("[install_torch]", " ".join(cmd))
    completed = subprocess.run(cmd)
    return int(completed.returncode)


def has_nvidia_gpu() -> bool:
    try:
        completed = subprocess.run(
            ["nvidia-smi", "-L"],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            check=False,
        )
    except FileNotFoundError:
        return False

    return completed.returncode == 0 and bool((completed.stdout or "").strip())


def install_from_index(index_url: str) -> bool:
    cmd = [
        sys.executable,
        "-m",
        "pip",
        "install",
        "--upgrade",
        "--index-url",
        index_url,
        "torch",
        "torchvision",
    ]
    return run(cmd) == 0


def verify_torch() -> tuple[bool, str]:
    snippet = (
        "import torch; "
        "print(f'{torch.__version__}|cuda={torch.cuda.is_available()}'); "
        "print(torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'CPU')"
    )
    cmd = [
        sys.executable,
        "-c",
        snippet,
    ]
    completed = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, check=False)
    output = (completed.stdout or "").strip()
    ok = completed.returncode == 0
    return ok, output


def main() -> int:
    print("[install_torch] Removing existing torch wheels (if present)...")
    run([sys.executable, "-m", "pip", "uninstall", "-y", "torch", "torchvision", "torchaudio"])

    if has_nvidia_gpu():
        print("[install_torch] NVIDIA GPU detected. Trying CUDA builds...")
        # Try newer CUDA wheels first, then widely available fallback.
        cuda_indexes = [
            "https://download.pytorch.org/whl/cu124",
            "https://download.pytorch.org/whl/cu121",
            "https://download.pytorch.org/whl/cu118",
        ]
        for index in cuda_indexes:
            if install_from_index(index):
                ok, summary = verify_torch()
                print("[install_torch]", summary)
                if ok and "cuda=True" in summary:
                    print(f"[install_torch] Success with index {index}")
                    return 0
                print("[install_torch] Installed but CUDA not active. Trying next option...")

        print("[install_torch] CUDA wheel install did not yield cuda=True. Falling back to CPU build.")
    else:
        print("[install_torch] No NVIDIA GPU detected. Installing CPU build.")

    if not install_from_index("https://download.pytorch.org/whl/cpu"):
        print("[install_torch] CPU install failed.")
        return 1

    ok, summary = verify_torch()
    print("[install_torch]", summary)
    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(main())

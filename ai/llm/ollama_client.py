"""REST wrapper for Ollama API."""

from __future__ import annotations

import base64
import json
import time
import requests

from config import OLLAMA_URL, OLLAMA_MODEL, OLLAMA_VISION_MODEL


# ==========================================================
# DEFAULT TIMEOUTS (UPDATED)
# ==========================================================

DEFAULT_CONNECT_TIMEOUT = 10
DEFAULT_READ_TIMEOUT = 900
DEFAULT_TOTAL_TIMEOUT = 1200


# ==========================================================
# HELPERS
# ==========================================================

def _normalize_timeout(timeout):
    """
    Supports:
        None                -> defaults
        int / float         -> total timeout only
        (connect, read)
        (connect, read, total)
    """
    if timeout is None:
        return (
            DEFAULT_CONNECT_TIMEOUT,
            DEFAULT_READ_TIMEOUT,
            DEFAULT_TOTAL_TIMEOUT,
        )

    if isinstance(timeout, (int, float)):
        return (
            DEFAULT_CONNECT_TIMEOUT,
            DEFAULT_READ_TIMEOUT,
            timeout,
        )

    if isinstance(timeout, tuple):
        if len(timeout) == 2:
            return timeout[0], timeout[1], DEFAULT_TOTAL_TIMEOUT

        if len(timeout) == 3:
            return timeout[0], timeout[1], timeout[2]

    return (
        DEFAULT_CONNECT_TIMEOUT,
        DEFAULT_READ_TIMEOUT,
        DEFAULT_TOTAL_TIMEOUT,
    )


def _post_generate(payload: dict, timeout=None) -> str:
    connect_timeout, read_timeout, total_timeout = _normalize_timeout(timeout)

    start = time.time()
    stream = payload.get("stream", False)

    if stream:
        output = ""

        with requests.post(
            f"{OLLAMA_URL}/api/generate",
            json=payload,
            stream=True,
            timeout=(connect_timeout, read_timeout),
        ) as r:
            r.raise_for_status()

            for line in r.iter_lines(decode_unicode=True):
                if time.time() - start > total_timeout:
                    raise requests.Timeout("Total timeout exceeded")

                if not line:
                    continue

                try:
                    chunk = json.loads(line)
                    output += chunk.get("response", "")

                    if chunk.get("done", False):
                        break

                except Exception:
                    pass

        return output.strip()

    # non-stream mode
    r = requests.post(
        f"{OLLAMA_URL}/api/generate",
        json=payload,
        timeout=(connect_timeout, read_timeout),
    )
    r.raise_for_status()

    if time.time() - start > total_timeout:
        raise requests.Timeout("Total timeout exceeded")

    return r.json().get("response", "").strip()


# ==========================================================
# STATUS CHECKS
# ==========================================================

def is_ollama_available() -> bool:
    try:
        r = requests.get(
            f"{OLLAMA_URL}/api/tags",
            timeout=(5, 5),
        )
        return r.status_code == 200
    except Exception:
        return False


def is_vision_model_available() -> bool:
    try:
        r = requests.get(
            f"{OLLAMA_URL}/api/tags",
            timeout=(5, 5),
        )

        if r.status_code != 200:
            return False

        models = [m["name"] for m in r.json().get("models", [])]
        return any(OLLAMA_VISION_MODEL in m for m in models)

    except Exception:
        return False


# ==========================================================
# TEXT GENERATION
# ==========================================================

def generate(
    prompt: str,
    system: str = "",
    model: str = OLLAMA_MODEL,
    timeout=None,
    stream: bool = True,
    num_predict: int = 1000,
) -> str:

    payload = {
        "model": model,
        "prompt": prompt,
        "stream": stream,
        "options": {
            "num_predict": num_predict,
            "temperature": 0.4,
        },
    }

    if system:
        payload["system"] = system

    try:
        return _post_generate(payload, timeout=timeout)

    except requests.ConnectionError:
        return "[Error: Cannot connect to Ollama. Is it running?]"

    except requests.Timeout:
        return "[Error: Ollama request timed out]"

    except Exception as e:
        return f"[Error: {e}]"


# ==========================================================
# VISION GENERATION
# ==========================================================

def generate_with_images(
    prompt: str,
    images: list[bytes],
    system: str = "",
    model: str = OLLAMA_VISION_MODEL,
    timeout=None,
    stream: bool = True,
    num_predict: int = 800,
    **kwargs,
) -> str:
    """
    Optimized vision request.
    """

    # limit frames to 3 max
    images = images[:3]

    images_b64 = [
        base64.b64encode(img).decode("utf-8")
        for img in images
    ]

    payload = {
        "model": model,
        "prompt": prompt,
        "images": images_b64,
        "stream": stream,
        "options": {
            "num_predict": num_predict,
            "temperature": 0.3,
        },
    }

    if system:
        payload["system"] = system

    try:
        return _post_generate(payload, timeout=timeout)

    except requests.ConnectionError:
        return "[Error: Cannot connect to Ollama. Is it running?]"

    except requests.Timeout:
        return "[Error: Vision request timed out — reduce frames or use smaller model]"

    except Exception as e:
        return f"[Error: {e}]"
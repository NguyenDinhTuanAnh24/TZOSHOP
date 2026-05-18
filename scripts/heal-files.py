import sys
from pathlib import Path

# Complete, programmatically verified mapping of all CP1258/CP1252 characters >= 256 back to their original byte values
REVERSE_MAP = {
    '€': 128, '‚': 130, 'ƒ': 131, '„': 132, '…': 133, '†': 134, '‡': 135, 'ˆ': 136, '‰': 137, 'Š': 138, '‹': 139, 'Œ': 140,
    'Ž': 142, '‘': 145, '’': 146, '“': 147, '”': 148, '•': 149, '–': 150, '—': 151, '˜': 152, '™': 153, 'š': 154, '›': 155,
    'œ': 156, 'ž': 158, 'Ÿ': 159, 'Ă': 195, '̀': 204, 'Đ': 208, '̉': 210, 'Ơ': 213, 'Ư': 221, '̃': 222, 'ă': 227, '́': 236,
    'đ': 240, '̣': 242, 'ơ': 245, 'ư': 253, '₫': 254
}

FILES_TO_HEAL = [
    Path("src/app/page.tsx"),
    Path("src/app/docs/api/page.tsx")
]

def heal_file(path: Path) -> bool:
    if not path.exists():
        print(f"File not found: {path}")
        return False
    
    print(f"Healing {path}...")
    try:
        text = path.read_text(encoding="utf-8")
        
        byte_arr = bytearray()
        for c in text:
            if c in REVERSE_MAP:
                byte_arr.append(REVERSE_MAP[c])
            elif ord(c) < 256:
                byte_arr.append(ord(c))
            else:
                byte_arr.extend(c.encode('utf-8'))
        
        healed_text = byte_arr.decode('utf-8')
        
        # Write back healed text
        path.write_text(healed_text, encoding="utf-8")
        print(f"Successfully healed {path}!")
        return True
    except Exception as e:
        print(f"Failed to heal {path}: {e}")
        return False

def main():
    success_count = 0
    for path in FILES_TO_HEAL:
        if heal_file(path):
            success_count += 1
    print(f"\nCompleted! Healed {success_count}/{len(FILES_TO_HEAL)} files.")

if __name__ == "__main__":
    main()

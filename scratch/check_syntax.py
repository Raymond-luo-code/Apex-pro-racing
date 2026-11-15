import glob

for fpath in glob.glob('js/*.js'):
    with open(fpath, 'r', encoding='utf-8') as f:
        code = f.read()
    depth = 0
    in_str = False
    str_ch = ''
    in_line_cmt = False
    in_block_cmt = False
    err = None
    i = 0
    line_num = 1
    while i < len(code):
        ch = code[i]
        if ch == '\n':
            line_num += 1
            in_line_cmt = False
        elif in_line_cmt:
            pass
        elif in_block_cmt:
            if ch == '*' and i + 1 < len(code) and code[i+1] == '/':
                in_block_cmt = False
                i += 1
        elif in_str:
            if ch == '\\':
                i += 1
            elif ch == str_ch:
                in_str = False
        else:
            if ch == '/' and i + 1 < len(code) and code[i+1] == '/':
                in_line_cmt = True
                i += 1
            elif ch == '/' and i + 1 < len(code) and code[i+1] == '*':
                in_block_cmt = True
                i += 1
            elif ch in ('"', "'", '`'):
                in_str = True
                str_ch = ch
            elif ch == '{':
                depth += 1
            elif ch == '}':
                depth -= 1
                if depth < 0 and err is None:
                    err = f'Mismatched }} at line {line_num}'
        i += 1
    status = 'OK' if (depth == 0 and err is None) else f'ERR: depth={depth}, {err}'
    print(f'{fpath}: {status}')


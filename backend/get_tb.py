import re
with open('uvicorn.log', 'r') as f:
    text = f.read()

# Find the last traceback
tb_idx = text.rfind('Traceback (most recent')
if tb_idx != -1:
    print(text[tb_idx:tb_idx+2000])
else:
    print('No traceback found')

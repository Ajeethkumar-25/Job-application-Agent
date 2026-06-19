import bcrypt

hashed = b'$2b$12$CPjyYbP8mbLLa4BlijlIVeuClmDXI9l/PBuXGMxWXVqq9JF9LO41C'
plain = b'password'

try:
    print(bcrypt.checkpw(plain, hashed))
except Exception as e:
    print(e)

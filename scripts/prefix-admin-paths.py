from pathlib import Path
import re

roots = [
    Path("src/staff"),
    Path("src/app/(admin-portal)"),
]

SEGMENTS = [
    "dashboard",
    "login",
    "products",
    "categories",
    "orders",
    "customers",
    "media",
    "settings",
    "printify",
    "contact-submissions",
    "profile",
]

seg_alt = "|".join(re.escape(s) for s in SEGMENTS)
# "/dashboard" "/products/foo" `/products/${id}` after quotes/backticks/(/=
pattern = re.compile(rf'(?<!/admin)(?<=["\'`(=])/(?:{seg_alt})\b')

changed: list[str] = []
for root in roots:
    for path in root.rglob("*"):
        if path.suffix not in {".ts", ".tsx"}:
            continue
        text = path.read_text()
        new = pattern.sub(lambda m: "/admin" + m.group(0), text)
        new = new.replace("/admin/admin/", "/admin/")
        if new != text:
            path.write_text(new)
            changed.append(str(path))

print(f"updated {len(changed)} files")
for p in changed:
    print(p)

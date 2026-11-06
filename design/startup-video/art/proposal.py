from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

root = Path(__file__).resolve().parents[1]
repo = root.parents[1]
scale = 2
image = Image.new('RGB', (800 * scale, 1096 * scale), '#f1f5f9')
draw = ImageDraw.Draw(image)
colors = {'surface': '#ffffff', 'surface2': '#f8fafc', 'surface3': '#f1f5f9', 'ink': '#464647', 'muted': '#7e7e7f', 'brand': '#536dfe', 'line': '#e3e3e3', 'video': '#262626'}

def font(size=14, weight='Regular'):
    return ImageFont.truetype(str(repo / 'src/assets/fonts/vazir' / f'Vazirmatn-FD-{weight}.woff2'), size * scale)

def rect(x, y, width, height, color, radius=12, border=None):
    draw.rounded_rectangle((x * scale, y * scale, (x + width) * scale, (y + height) * scale), radius * scale, fill=color, outline=border, width=scale)

def text(x, y, value, size=14, color=None, weight='Regular', rtl=True):
    draw.text((x * scale, y * scale), value, font=font(size, weight), fill=color or colors['ink'], anchor='ra' if rtl else 'la', direction='rtl' if rtl else 'ltr')

def button(x, y, width, label, primary=False, disabled=False):
    rect(x, y, width, 32, colors['brand'] if primary else colors['surface2'], 12, None if primary else colors['line'])
    label_font = font(12, 'SemiBold')
    bounds = draw.textbbox((0, 0), label, font=label_font, direction='rtl')
    draw.text(((x + width / 2) * scale - (bounds[0] + bounds[2]) / 2, (y + 16) * scale - (bounds[1] + bounds[3]) / 2), label, font=label_font, fill=colors['surface'] if primary else colors['muted'] if disabled else colors['ink'], direction='rtl')

text(760, 24, 'ویدیوی شروع', 24, weight='Bold')
text(760, 64, 'پیشنهاد طراحی · در انتظار تایید', 12, colors['muted'])
text(40, 31, 'Widgetify / startup video', 14, rtl=False)
text(760, 108, 'تنظیمات ← عمومی', 14, weight='Medium')
rect(40, 144, 720, 240, colors['surface'], 16)
text(736, 160, 'ویدیو موقع باز شدن مرورگر', 16, weight='Medium')
rect(64, 160, 44, 24, colors['brand'], 12)
draw.ellipse((88 * scale, 164 * scale, 104 * scale, 180 * scale), fill=colors['surface'])
draw.line((52 * scale, 196 * scale, 748 * scale, 196 * scale), fill=colors['surface3'], width=scale)
text(736, 212, 'هر بار مرورگر رو باز کنی، یه ویدیو آماده‌ی پخش میشه', 14)
text(736, 244, 'پخش فقط با کلیک تو شروع میشه', 12, colors['muted'])
text(736, 282, 'ویدیوهای من · ۱۲ ویدیو', 14, weight='Medium')
button(64, 280, 112, 'تغییر پوشه')
text(736, 324, 'ویدیوها از همین پوشه خونده میشن و جایی فرستاده نمیشن', 12, colors['muted'])
text(736, 350, 'تغییرهای پوشه با باز شدن پنجره خونده میشن', 12, colors['muted'])
text(760, 412, 'اولین نمایش بعد از شروع مرورگر', 14, weight='Medium')
rect(24, 452, 752, 556, '#606264', 24)
rect(40, 468, 720, 524, colors['surface'], 24)
text(736, 486, 'ویدیوی شروع', 16, weight='Medium')
button(64, 484, 64, 'بستن')
rect(56, 532, 688, 348, colors['video'], 16)
button(336, 684, 128, 'پخش ویدیو', primary=True)
hint = 'ویدیو منتظر کلیک توئه'
hint_width = draw.textlength(hint, font=font(12), direction='rtl') / scale
text(400 + hint_width / 2, 738, hint, 12, '#c9c9c9')
text(736, 896, '۳ از ۱۲', 12, colors['muted'])
text(64, 896, 'Morning-walk.mp4', 14, rtl=False)
button(64, 936, 88, 'قبلی')
button(160, 936, 88, 'بعدی')
text(736, 942, 'با بستن پنجره، پخش هم متوقف میشه', 12, colors['muted'])
text(760, 1032, 'خاموش: پنجره باز نمیشه · یک ویدیو: قبلی و بعدی غیرفعال', 12, colors['muted'])
text(760, 1062, 'دسترسی پوشه قطع شد: اتصال دوباره · خطای ویدیو: بعدی یا بستن', 12, colors['muted'])
image.save(root / 'assets/proposal.png')

# פתרון פרויקט מנתח PE וספרייה יציבה

הפתרון בנוי בשכבות. קורא הקובץ מחזיק ב־bytes, המנתח שואל שאלות מוגבלות על טווחים, וממשק C מתרגם תוצאות לקוד יציב. אם מערבבים את שלוש השכבות, קשה לבדוק קלט בלי קובץ וקשה להבחין בין כשל מערכת לכשל פורמט.

## מגדירים גבול ללא בעלות נסתרת

ה־header הבא נשמר בשם `pe_api.h`. הוא מדגים את החוזה לגרסת הכותרת הבסיסית; הרחבת ה־sections וה־directories מתבצעת באמצעות פונקציות נוספות בלי שינוי החתימה הקיימת.

```cpp
#pragma once
#include <stddef.h>
#include <stdint.h>

#ifdef PE_BUILD
#define PE_API __declspec(dllexport)
#else
#define PE_API __declspec(dllimport)
#endif

#ifdef __cplusplus
extern "C" {
#endif

enum pe_status {
    PE_OK = 0,
    PE_INVALID_ARGUMENT = 1,
    PE_TRUNCATED = 2,
    PE_BAD_FORMAT = 3,
    PE_UNSUPPORTED = 4
};

typedef struct pe_summary {
    uint32_t struct_size;
    uint32_t api_version;
    uint32_t machine;
    uint32_t section_count;
    uint32_t entry_rva;
    uint32_t image_size;
    uint32_t header_size;
    uint32_t optional_magic;
    uint64_t image_base;
} pe_summary;

PE_API uint32_t __cdecl pe_api_version(void);
PE_API int __cdecl pe_inspect(const unsigned char* data, size_t size,
                             pe_summary* output, size_t output_size);

#ifdef __cplusplus
}
#endif
```

הפרמטר output_size מאפשר לדחות לקוח שבנה מבנה בגודל אחר. אין להסיק שגודל מתאים מוכיח layout מתאים בכל ABI אפשרי; ההפצה מגדירה ארכיטקטורה, packing טבעי וגרסת חוזה נתמכת. אין להקיף את ה־header ב־pragma pack פרטי של הלקוח.

## מממשים קריאה שאינה זזה לפני בדיקה

הקובץ הבא נשמר כ־`pe_api.cpp`. הוא מאמת את הכותרות ואת טבלת ה־sections ואת טווחי raw data. הוא אינו מקצה זיכרון ואינו שומר מצביע אחרי החזרה.

```cpp
#define PE_BUILD
#include "pe_api.h"
#include <cstdint>
#include <cstring>

namespace {
struct Reader {
    const unsigned char* data;
    std::size_t size;

    bool contains(std::size_t offset, std::size_t length) const {
        return offset <= size && length <= size - offset;
    }
    std::uint16_t u16(std::size_t offset) const {
        return static_cast<std::uint16_t>(
            data[offset] | (static_cast<unsigned>(data[offset + 1]) << 8));
    }
    std::uint32_t u32(std::size_t offset) const {
        std::uint32_t result = 0;
        for (unsigned i = 0; i < 4; ++i)
            result |= static_cast<std::uint32_t>(data[offset + i]) << (i * 8);
        return result;
    }
    std::uint64_t u64(std::size_t offset) const {
        return static_cast<std::uint64_t>(u32(offset)) |
               (static_cast<std::uint64_t>(u32(offset + 4)) << 32);
    }
};
}

extern "C" uint32_t __cdecl pe_api_version(void) {
    return 1;
}

extern "C" int __cdecl pe_inspect(
    const unsigned char* data, size_t size,
    pe_summary* output, size_t output_size) {
    if ((!data && size != 0) || !output || output_size != sizeof(pe_summary))
        return PE_INVALID_ARGUMENT;

    Reader input{data, size};
    if (!input.contains(0, 64)) return PE_TRUNCATED;
    if (input.u16(0) != 0x5a4d) return PE_BAD_FORMAT;
    const std::size_t nt = input.u32(0x3c);
    if (!input.contains(nt, 24)) return PE_TRUNCATED;
    if (input.u32(nt) != 0x00004550) return PE_BAD_FORMAT;

    const auto count = input.u16(nt + 6);
    const auto optional_size = input.u16(nt + 20);
    if (count == 0 || count > 96) return PE_UNSUPPORTED;
    const auto optional = nt + 24;
    if (!input.contains(optional, optional_size)) return PE_TRUNCATED;
    if (optional_size < 2) return PE_BAD_FORMAT;

    const auto magic = input.u16(optional);
    const std::size_t minimum =
        magic == 0x10b ? 96 : magic == 0x20b ? 112 : 0;
    if (minimum == 0) return PE_UNSUPPORTED;
    if (optional_size < minimum) return PE_BAD_FORMAT;

    const auto table = optional + optional_size;
    const auto table_size = static_cast<std::size_t>(count) * 40;
    if (!input.contains(table, table_size)) return PE_TRUNCATED;

    pe_summary candidate{};
    candidate.struct_size = sizeof(candidate);
    candidate.api_version = 1;
    candidate.machine = input.u16(nt + 4);
    candidate.section_count = count;
    candidate.entry_rva = input.u32(optional + 16);
    candidate.image_size = input.u32(optional + 56);
    candidate.header_size = input.u32(optional + 60);
    candidate.optional_magic = magic;
    candidate.image_base = magic == 0x20b ?
        input.u64(optional + 24) : input.u32(optional + 28);

    if (candidate.header_size > size ||
        table > candidate.header_size ||
        table_size > candidate.header_size - table)
        return PE_BAD_FORMAT;

    for (std::size_t i = 0; i < count; ++i) {
        const auto section = table + i * 40;
        const auto raw_size = input.u32(section + 16);
        const auto raw_offset = input.u32(section + 20);
        if (raw_size != 0 && !input.contains(raw_offset, raw_size))
            return PE_TRUNCATED;
        const auto virtual_size = input.u32(section + 8);
        const auto rva = input.u32(section + 12);
        const auto virtual_end =
            static_cast<std::uint64_t>(rva) + virtual_size;
        if (virtual_end > candidate.image_size) return PE_BAD_FORMAT;
    }
    *output = candidate;
    return PE_OK;
}
```

הפונקציות u16 ו־u32 מניחות שהקורא כבר בדק טווח. זאת החלטת מבנה: כל שדה נקרא רק אחרי אימות המבנה שמכיל אותו. בגרסה אחרת אפשר שכל קריאה תחזיר תוצאה עם שגיאה. העיקר הוא שלא תהיה קריאה שהבדיקה שלה נמצאת רק בהערה.

החישוב של מיקום הטבלה בטוח כאן כי ה־optional header כבר הוכח כטווח בתוך size. מספר ה־sections מוגבל לפני הכפל. חישוב סוף הטווח הווירטואלי נעשה ב־64 ביט, כדי שסכום של שני שדות בני 32 ביט לא יתקפל.

## בונים לקוח שמבדיל קובץ מפורמט

הקובץ הבא נשמר כ־`inspect.cpp`. הוא מגביל את גודל הקלט לצורך המעבדה ומציג את קוד השגיאה בלי לנסות להפעיל את הקובץ.

```cpp
#include "pe_api.h"
#include <cstdio>
#include <fstream>
#include <vector>

int main(int argc, char** argv) {
    if (argc != 2) return 1;
    std::ifstream file(argv[1], std::ios::binary | std::ios::ate);
    if (!file) return 2;
    const auto size = file.tellg();
    if (size < 0 || size > 64 * 1024 * 1024) return 3;
    std::vector<unsigned char> bytes(static_cast<std::size_t>(size));
    file.seekg(0);
    if (!bytes.empty() && !file.read(
            reinterpret_cast<char*>(bytes.data()),
            static_cast<std::streamsize>(bytes.size())))
        return 4;
    pe_summary summary{};
    const int status = pe_inspect(
        bytes.data(), bytes.size(), &summary, sizeof(summary));
    if (status != PE_OK) {
        std::printf("parse status=%d\n", status);
        return 5;
    }
    std::printf("machine=%04x sections=%u entry=%08x base=%llx\n",
        static_cast<unsigned>(summary.machine),
        static_cast<unsigned>(summary.section_count),
        static_cast<unsigned>(summary.entry_rva),
        static_cast<unsigned long long>(summary.image_base));
}
```

```powershell
cl /nologo /std:c++20 /EHsc /W4 /MD /LD /Zi pe_api.cpp /link /OUT:pe_api.dll /IMPLIB:pe_api.lib /DEBUG
cl /nologo /std:c++20 /EHsc /W4 /MD inspect.cpp pe_api.lib /Feinspect.exe
.\inspect.exe .\inspect.exe
```

הלקוח הדינמי משתמש בתבנית משיעור 3.5, עם typedef ל־`pe_api_version` ול־`pe_inspect`. הוא בודק גרסה לפני ניתוח ומשחרר את ה־module רק אחרי שהקריאה הסתיימה. אין ב־summary מצביעים ל־DLL, ולכן הנתונים שהועתקו נשארים זמינים גם אחרי unloading.

## משלימים את שאילתת ה־sections

ההצהרות הבאות מצטרפות ל־pe_api.h בתוך בלוק ה־extern C. הפונקציות נשארות stateless, ולכן כל קריאה מקבלת מחדש טווח חי ומאומת.

```cpp
typedef struct pe_section_info {
    char name[9];
    uint32_t rva;
    uint32_t virtual_size;
    uint32_t raw_offset;
    uint32_t raw_size;
    uint32_t characteristics;
} pe_section_info;

PE_API int __cdecl pe_section_at(const unsigned char* data, size_t size,
    uint32_t index, pe_section_info* output, size_t output_size);
PE_API int __cdecl pe_rva_to_file(const unsigned char* data, size_t size,
    uint32_t rva, uint32_t length, uint64_t* output);
```

המימוש הבא מצטרף ל־pe_api.cpp. הקוד משתמש באותה בדיקת כותרות לפני גישה לטבלת sections.

```cpp
extern "C" int __cdecl pe_section_at(
    const unsigned char* data, size_t size, uint32_t index,
    pe_section_info* output, size_t output_size) {
    if (!output || output_size != sizeof(pe_section_info))
        return PE_INVALID_ARGUMENT;
    pe_summary summary{};
    const int status = pe_inspect(data, size, &summary, sizeof(summary));
    if (status != PE_OK) return status;
    if (index >= summary.section_count) return PE_INVALID_ARGUMENT;
    Reader input{data, size};
    const std::size_t nt = input.u32(0x3c);
    const auto table = nt + 24 + input.u16(nt + 20);
    const auto position = table + static_cast<std::size_t>(index) * 40;
    pe_section_info candidate{};
    std::memcpy(candidate.name, data + position, 8);
    candidate.name[8] = '\0';
    candidate.virtual_size = input.u32(position + 8);
    candidate.rva = input.u32(position + 12);
    candidate.raw_size = input.u32(position + 16);
    candidate.raw_offset = input.u32(position + 20);
    candidate.characteristics = input.u32(position + 36);
    *output = candidate;
    return PE_OK;
}

extern "C" int __cdecl pe_rva_to_file(
    const unsigned char* data, size_t size, uint32_t rva,
    uint32_t length, uint64_t* output) {
    if (!output || length == 0) return PE_INVALID_ARGUMENT;
    pe_summary summary{};
    int status = pe_inspect(data, size, &summary, sizeof(summary));
    if (status != PE_OK) return status;
    unsigned matches = 0;
    std::uint64_t candidate = 0;
    if (rva < summary.header_size &&
        length <= summary.header_size - rva) {
        candidate = rva;
        ++matches;
    }
    for (std::uint32_t i = 0; i < summary.section_count; ++i) {
        pe_section_info section{};
        status = pe_section_at(data, size, i, &section, sizeof(section));
        if (status != PE_OK) return status;
        if (rva < section.rva) continue;
        const auto delta = static_cast<std::uint64_t>(rva) - section.rva;
        if (delta >= section.raw_size ||
            length > static_cast<std::uint64_t>(section.raw_size) - delta)
            continue;
        const auto offset =
            static_cast<std::uint64_t>(section.raw_offset) + delta;
        if (offset > size || length > size - offset) return PE_TRUNCATED;
        candidate = offset;
        ++matches;
    }
    if (matches == 0) return PE_UNSUPPORTED;
    if (matches != 1) return PE_BAD_FORMAT;
    *output = candidate;
    return PE_OK;
}
```

המדיניות מחזירה PE_UNSUPPORTED לטווח שאינו מגובה בנתוני קובץ, גם אם הוא עשוי להיות אזור וירטואלי תקין. התאמה כפולה נדחית. ההחלטה אינה טוענת שכך הטוען יטפל בכל PE חריג; היא מגדירה מנתח מחמיר שאינו בוחר מיפוי עמום בשקט.

הקטע הבא מצטרף ללקוח inspect לפני סוף main, אחרי הצלחת pe_inspect. הוא מציג את הרשומות ואת מיפוי נקודת הכניסה.

```cpp
for (std::uint32_t i = 0; i < summary.section_count; ++i) {
    pe_section_info section{};
    const int item_status = pe_section_at(
        bytes.data(), bytes.size(), i, &section, sizeof(section));
    if (item_status != PE_OK) return 6;
    std::printf("%-8s rva=%08x virtual=%08x raw=%08x size=%08x flags=%08x\n",
        section.name, static_cast<unsigned>(section.rva),
        static_cast<unsigned>(section.virtual_size),
        static_cast<unsigned>(section.raw_offset),
        static_cast<unsigned>(section.raw_size),
        static_cast<unsigned>(section.characteristics));
}
std::uint64_t offset = 0;
const int mapped = pe_rva_to_file(bytes.data(), bytes.size(),
    summary.entry_rva, 1, &offset);
std::printf("entry mapping status=%d offset=%llu\n",
    mapped, static_cast<unsigned long long>(offset));
```

הלקוח צריך לכלול גם `<cstdint>` עבור השמות שבמרחב std. כותרת ה־API נשארת C-compatible, ולכן אינה מבטיחה שמות כאלה בעצמה.

## בונים לקוח שני שמפעיל כשל צפוי

הקובץ הבא נשמר בשם `probe.cpp` ונבנה בלי import library. הוא טוען במפורש, בודק גרסה ושולח קלט קטוע שנמצא כולו בזיכרון.

```cpp
#define WIN32_LEAN_AND_MEAN
#include <windows.h>
#include "pe_api.h"
#include <array>
#include <cstdio>
#include <filesystem>

int wmain(int argc, wchar_t** argv) {
    if (argc != 2 || !std::filesystem::path(argv[1]).is_absolute()) return 1;
    HMODULE module = LoadLibraryExW(argv[1], nullptr,
        LOAD_LIBRARY_SEARCH_DLL_LOAD_DIR | LOAD_LIBRARY_SEARCH_SYSTEM32);
    if (!module) return 2;
    using Version = uint32_t (__cdecl*)(void);
    using Inspect = int (__cdecl*)(const unsigned char*, size_t,
                                  pe_summary*, size_t);
    auto version = reinterpret_cast<Version>(
        GetProcAddress(module, "pe_api_version"));
    auto inspect = reinterpret_cast<Inspect>(
        GetProcAddress(module, "pe_inspect"));
    if (!version || !inspect || version() != 1) {
        FreeLibrary(module);
        return 3;
    }
    const std::array<unsigned char, 2> truncated{'M', 'Z'};
    pe_summary output{};
    output.entry_rva = 0x12345678;
    const int status = inspect(truncated.data(), truncated.size(),
                               &output, sizeof(output));
    const bool correct = status == PE_TRUNCATED &&
                         output.entry_rva == 0x12345678;
    std::printf("status=%d preserved=%d\n", status, correct ? 1 : 0);
    FreeLibrary(module);
    return correct ? 0 : 4;
}
```

```powershell
cl /nologo /std:c++20 /EHsc /W4 /MD probe.cpp /Feprobe.exe
dumpbin /imports inspect.exe
dumpbin /exports pe_api.dll
dumpbin /headers inspect.exe
dumpbin /relocations inspect.obj
```

הבדיקה הדינמית אינה מנסה לקרוא שום export אחרי FreeLibrary. שינוי הספרייה והפעלת probe ישן מאפשרים לבחון תאימות ממשית, משום שהלקוח אינו נבנה מחדש בכל שינוי.

## פותרים את חקירת ה־directories

החלק המחקרי של הפרויקט משתמש ב־dumpbin כדי לקרוא imports ו־relocations מתוך תוצרים מוכרים, ומחשב ידנית המרה אחת דרך טבלת sections. המנתח שכתבנו מספק את מיפוי ה־RVA הבטוח הנדרש לחישוב, אך אינו מצהיר שהוא parser מלא של כל directory.

ב־imports מזהים את שם התלות ואת הסמל, ומשווים למימוש שנמצא בטבלת exports. ב־base relocations מסמנים מיקום אחד וסוג תיקון, מחשבים את הפרש בסיסי הטעינה ומסבירים מדוע רק המיקום המסומן משתנה. ב־exports בודקים אם הערך הוא forwarder, ומסבירים שהשם המופנה אינו בהכרח קוד באותו module.

הבדיקות והפונקציות המוצגות משלימות את תוצר הפרויקט המוגדר: סיכום, sections, המרת RVA, שני לקוחות ותחקיר directories. מימוש parser עצמאי לכל סוג directory הוא הרחבה נוספת שאפשר לבצע בהמשך מתוך אותה תשתית, ואין לספור אותו כתנאי שהפתרון הזה כבר מממש.

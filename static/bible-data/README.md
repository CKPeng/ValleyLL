# 圣经数据 JSON 文件

本目录包含从 SQLite 数据库导出的圣经数据，用于支持小程序和 H5 环境。

## 文件结构

### 索引文件
- `bible-index.json` - 包含66卷书的元数据（书卷序号、章节数、书名等）

### 章节文件
- `volume-{卷号}-chapter-{章号}.json` - 各章节的经文内容
- 例如：`volume-1-chapter-1.json` 是创世记第1章

## 数据格式

### bible-index.json
```json
[
  {
    "sn": 1,
    "kindSN": 1,
    "chapters": 50,
    "newOrOld": 0,
    "pinyin": "CSJ",
    "shortName": "创",
    "fullName": "创世记"
  },
  ...
]
```

### volume-X-chapter-Y.json
```json
[
  {
    "verse": 1,
    "text": "起初，　神创造天地。"
  },
  ...
]
```

## 统计信息
- 总书卷数：66卷
- 总章节数：1189章
- 总经文数：31103节

## 生成方法
这些文件由 SQLite 数据库自动导出，包含完整的和合本圣经内容。

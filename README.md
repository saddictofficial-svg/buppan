# BUPPAN

事業成長パートナー「BUPPAN」の事業部サイト。64bit（ドット絵・ネオンアーケード）風のデザインで、ファーストビューにみなとみらいの夜景をcanvasのドット絵で描画しています。

## 構成

| ファイル | 役割 |
|---|---|
| `index.html` | ページ本体（構造） |
| `style.css` | デザイン・アニメーション |
| `script.js` | 動き（みなとみらい夜景の描画・カウントアップ等） |
| `fonts.css` | ドットフォント（Press Start 2P）埋め込み |

## ローカルで見る

```bash
python3 -m http.server 8000
# → http://localhost:8000
```

VS Code なら Live Server 拡張の「Go Live」でもOK。

## デプロイ

- 静的サイトなので、GitHub Pages / Vercel にそのまま公開できます。

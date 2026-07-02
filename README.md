# CanvasNote - PDF編集Webアプリ

PowerPointのようにページを見ながら、PDF・HTML・画像を編集できるローカルWebアプリです。

最も簡単な起動方法は、フォルダ内の `起動_CanvasNote.cmd` をダブルクリックすることです。`dist/index.html` は直接開かないでください。

## 起動方法

```powershell
npm install
npm run dev
```

ブラウザで `http://127.0.0.1:5173` を開きます。資料はブラウザ内のIndexedDBへ自動保存されます。

## 主な機能

- PDFをページ単位で読み込み、文字を編集要素へ変換
- 画像PDF・スキャンPDFの日本語OCR
- ドラッグ範囲選択、複数要素の一括移動、整列、均等配置、グループ化
- 文字・図形・画像の追加、移動、サイズ変更、色変更
- PDF、HTML、PNG、再編集用JSONへの書き出し
- ダッシュボードから資料の再開・削除

詳しい手順は `docs/操作マニュアル.md` を参照してください。

## 旧試作メモ（参考）

HTML/CSSを読み込み、PowerPointのようにページ上の要素を編集してPDFへ出力するローカルWebアプリです。

## 起動

```powershell
npm install
npm run dev
```

ブラウザで `http://127.0.0.1:5173` を開きます。最初に保存資料のダッシュボードが表示され、編集内容は資料ごとにブラウザのIndexedDBへ自動保存されます。

## PDF出力

- 「すぐにPDF化」：ブラウザ内で画像ベースのPDFを生成します。
- 「高品質PDF」：別のターミナルで `npm run pdf-server` を起動してから使用します。文字とCSSをブラウザ印刷でPDF化します。

初回にChromiumが必要な場合は、`npx playwright install chromium` を実行してください。インストールされていなければMicrosoft Edgeを自動的に利用します。

## 対応ファイル

- HTML：一般的なHTML/CSSを非表示の安全なフレームで描画し、適用後の位置・サイズ・文字・背景・罫線を編集要素へ変換します。`@page size: A4`と印刷余白も反映します。`data-editor-id`、`data-editor-type`を持つCanvasNote形式も読み込めます。
- プロジェクト：`.canvasnote.json`。ページ、要素、埋め込み画像、文書設定を保持します。
- 書き出し：再編集可能HTML、プロジェクトJSON、PDF。
- ダッシュボード：複数資料の一覧、再編集、複製、削除、PNG画像出力。

## 確認

```powershell
npm test
npm run build
```

BUPPAN リニューアル版 LP　アップロード手順・注意点
作成日：2026年11月19日

■ 公開先
https://caddie.co.jp/buppan/
→ この zip の中の「buppan」フォルダの中身を、そのまま /buppan/ 直下に置いてください。
　 （index.html が https://caddie.co.jp/buppan/ で開ける状態）
→ ページ内の画像・CSS・JS はすべて相対パスです。サーバー側の設定変更は不要です。
→ ビルド工程はありません。静的ファイルをアップするだけで動きます。

■ ファイル構成
buppan/
├ index.html ……… ページ本体
├ style.css ……… デザイン
├ script.js ……… 動き・診断・フォーム・計測イベント
├ README.txt …… この説明書（アップ不要）
└ assets/
　 ├ hero_wide.mp4 / hero_tall.mp4 …… トップの背景動画（PC用・スマホ用、各約1MB・音声なし）
　 ├ hero_wide.webp / hero_tall.webp / hero_wide.jpg …… 動画の代わりの静止画（読み込み中・動きを減らす設定の端末用）
　 ├ og.jpg …………………… SNSシェア用画像（1200×630）
　 ├ buppan_lockup_white.svg / buppan_symbol_white.svg …… ロゴ
　 └ favicon.svg / favicon.ico / favicon-32.png / apple-touch-icon.png

■ 外部読み込み（許可が必要な環境の場合）
・Google Fonts（fonts.googleapis.com / fonts.gstatic.com）
・Google タグマネージャー（www.googletagmanager.com）　コンテナID：GTM-T529R6JH

■ 公開前に必ず確認してほしいこと
1. 動画（.mp4）のMIMEタイプが video/mp4 で配信されること。
   ※ 配信されない場合も静止画が表示されるので、ページは崩れません。
2. HTTPS で配信されること（og:image・canonical は https://caddie.co.jp/buppan/ 前提で記述済み）。

■ あとから差し替える箇所
・LINE友だち追加のURL（設定済み：https://lin.ee/wdB9ZW5）
　script.js の「var LINE_URL」を書き換えると、ページ内のLINEボタン全部（6か所）に反映されます。
・お問い合わせフォーム（送信方法は2つ）
　① ピンクのボタン：メールソフトを開いて buppan@caddie.co.jp 宛のメールを作る方式（mailto）
　② 緑のボタン「この内容をLINEで送る」：入力内容を文面に入れた状態で、LINE公式アカウント（@499ymnku）のトークを開く方式
　　 （https://line.me/R/oaMessage/ を使用。お客様がLINEで送信ボタンを押すと届きます）
　確実にサーバー側で受け取る形にする場合は、script.js の「お問い合わせ」部分を社内のフォーム送信先に差し替えてください。
　入力欄の name 属性：company / name / email / tel / type / message
・お客様の声
　現在はイメージ文（ページ上に注記あり）。掲載許可が取れた実際のお声に差し替え予定です。

■ 更新するときの注意（キャッシュ対策）
index.html の中で style.css と script.js を「style.css?v=23」「script.js?v=11」のように番号付きで読んでいます。
CSS・JS を書き換えたら、この番号を1つ上げてください（古いデザインが表示され続けるのを防ぎます）。

■ 計測（GTM）に送っているイベント
GTM 側で「カスタムイベント」のトリガーとして登録すると、GA4 で数えられます（GTM側の設定は未実施）。
・cta_click …………… 無料診断などの申し込みボタンのクリック（cta_text, cta_target）
・line_click ………… LINEボタンのクリック（cta_location：offer / contact / footer / fab / band1 / band2）
・tel_click …………… 電話番号のクリック（cta_location）
・form_submit ……… フォーム送信（inquiry_type：相談の種別、method：mail / line）
・self_check_complete … 30秒セルフ診断の完了（score, result）

■ 動作確認済み
・Chrome（PC 1920 / 1440 / 1024px、タブレット 820px、スマホ 375 / 360px）で表示・横はみ出しなし・改行崩れなしを確認
・動画再生、メニュー開閉、セルフ診断、フォームの入力チェック、計測イベントの送信を確認
・未確認：実機の iPhone / Android、Safari、Firefox

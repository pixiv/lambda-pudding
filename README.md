# インターン課題
ピクシブ百科事典に表示される広告の最適化

## 概要
- ピクシブ百科事典の記事 (place) ごとに，各広告の表示回数 (impression) とコンバージョン数 (conversion) を保持して，コンバージョン率が最適になる広告を 3 つ求めるバンディット問題と考える
- [Amazon API Gateway]( https://goo.gl/ha1f1a ) でリクエストを受け取り，[AWS Lambda]( http://goo.gl/avy4al ) を使って，DynamoDB に保存された情報を利用・更新して最適な広告を選んでいく
- [Serverless Framework]( https://goo.gl/vMO6PI ) を使って，Amazon Gateway API から Amazon Lambda を利用している


## エンドポイント一覧
パラメータの渡し方は Tool の項目を参考に．
- /ads
    - GET
        - 概要: 広告の選択
        - input: {place_id}
        - output: {3 つの広告の情報} (現在は JSONP で返却)
- /conversion
    - GET
        - 概要: conversion を行ったことを記録
        - input: {place_id, ads_id}
    - POST
        - 概要: conversion を行ったことを記録
        - input: {place_id, ads_id} (JSON. body で指定する)
- /admin
    - /ads
        - GET
            - 概要: 広告の一覧取得
            - output: {すべての広告の情報}
        - /{ads_id}
            - DELETE
                - 概要: 表示する広告の削除
                - input: {ads_id (pathで指定する)}
            - GET
                - 概要: 広告の情報を取得
                - input: {ads_id (pathで指定する)}
                - outpu: 広告の情報
            - PUT
                - 概要: 広告の新規登録・更新
                - input: {ads_id (pathで指定する), ads_info (JSON. body で指定する)}
    - /places (これは現状ほとんど使わない)
        - /{place_id}
            - DELETE
                - 概要: 記事の削除
                - input: {place_id (pathで指定する)}
            - PUT
                - 概要: 記事の追加 (存在する場合はなにもしない)．/ads が代わりに追加してくれる
                - input: {place_id (pathで指定する)}



## デプロイまで
このレポジトリは Serverless の 1 つのプロジェクトとして作成している．

### Serverless のセットアップ
参考: [Serverless の基本的な使い方](http://qiita.com/susieyy/items/1c2af0ef7b88b742c37a)

まずは，Serverless をインストールする．

```
npm install serverless -g
```

AWS でユーザ作成を行い，適切なポリシーを与えたグループにそのユーザを追加するか，ユーザに適切なポリシーを付与する．
ユーザ作成時には，SERVERLESS_ADMIN_AWS_ACCESS_KEY_ID, SERVERLESS_ADMIN_AWS_SECRET_ACCESS_KEY を記録しておく．

**(適切なポリシーを与えるところは大変でした…)**

参考:
- [IAMユーザを作成]( http://goo.gl/2D2cGT )
- [ユーザと管理グループの作成・ひも付け](http://docs.aws.amazon.com/ja_jp/IAM/latest/UserGuide/getting-started_create-admin-group.html)
    - これはすべての権限を与える例なので非推奨ですが参考に

適当なフォルダに移動して，Serverless の project を作成する．

```
sls project create
```

**(sls は serverless のエイリアス)**

すると，以下のように対話的な項目の設定画面が現れる．

```
 _______                             __
|   _   .-----.----.--.--.-----.----|  .-----.-----.-----.
|   |___|  -__|   _|  |  |  -__|   _|  |  -__|__ --|__ --|
|____   |_____|__|  \___/|_____|__| |__|_____|_____|_____|
|   |   |             The Serverless Application Framework
|       |                           serverless.com, v0.5.5
`-------'

Serverless: Initializing Serverless Project...
Serverless: Enter a name for this project:  (serverless-rkbtki) [プロジェクト名 (例: pixiv)]
Serverless: Enter a new stage name for this project:  (dev) [ステージ名 (例: dev)]
Serverless: For the "dev" stage, do you want to use an existing Amazon Web Services profile or create a new one?
    Existing Profile
  > Create A New Profile [先ほど作成した新しいユーザを紐付けるのでこちら]
Serverless: Please enter the ACCESS KEY ID for your Admin AWS IAM User:  [記録した SERVERLESS_ADMIN_AWS_ACCESS_KEY_ID]
Serverless: Enter the SECRET ACCESS KEY for your Admin AWS IAM User:  [記録した SERVERLESS_ADMIN_AWS_SECRET_ACCESS_KEY]
Serverless: Enter the name of your new profile:  (pixiv_dev) [このユーザのプロファイル名 (例: pixiv)]
Serverless: Creating stage "dev"...
Serverless: Select a new region for your stage:
    us-east-1
    us-west-2
    eu-west-1
    eu-central-1
  > ap-northeast-1 [Tokyo リージョンはここ]
Serverless: Creating region "ap-northeast-1" in stage "dev"...
Serverless: Deploying resources to stage "dev" in region "ap-northeast-1" via Cloudformation (~3 minutes)...
```

これで現在のフォルダに [プロジェクト名] のフォルダができる．

### レポジトリのクローンからデプロイまで
適当なフォルダで以下を実行．
```
git clone git@github.com:pixiv/lambda-pudding.git
```
上記で作成したプロジェクトの中身をすべて，このフォルダにコピー．

フォルダの中にある s-resource-cf.json を編集して，IAM のポリシーを設定する．
現在，以下のようになっているところを，
```
  "Resource": "arn:aws:dynamodb:[リージョン]:[アカウントID]:table/*"
```
AWSアカウントのIDを基に変更して，テーブルへのアクセス権限を作る．

アカウントID を知るためには，例えば，AWSコンソールのサービス一覧で IAM を選択し，
[IAM users sign-in link:] の

```
https://[アカウントID].signin.aws.amazon.com/console
```

からわかる．

変更したら
```
sls resources deploy
```
を行ってアップデートする．

これで設定ができたのでデプロイする．以下のコマンドを実行．
```
sls dash deploy
```
すると，以下のように選べるので，必要なfunction&endpoint を選んでデプロイ．
```
Serverless: Select the assets you wish to deploy:
    delete_item
  >   function - delete_item
      endpoint - admin/ads/{ads_id} - DELETE
    show_item
      function - show_item
      endpoint - admin/ads/{ads_id} - GET
    show_items
      function - show_items
      endpoint - admin/ads - GET
    update_item
      function - update_item
      endpoint - admin/ads/{ads_id} - PUT
    add_place
      function - add_place
      endpoint - admin/places/{place_id} - PUT
    delete_place
      function - delete_place
      endpoint - admin/places/{place_id} - DELETE
    ads
      function - ads
      endpoint - ads - GET
    conversion
      function - conversion
      endpoint - conversion - POST
    - - - - -
    Deploy
    Cancel
```

## API を叩く
- URL/ endpoint名
- URLは例えば `https://************.execute-api.ap-northeast-1.amazonaws.com/dev/conversion` (conversionの場合)


## テーブル構成

### テーブル一覧
使うテーブルは現状 3 つ．
- ads_ids
    - 広告の id 一覧を持つテーブル
- ads_contents
    - 広告の内容を持つテーブル
- counter
    - 記事ごとの広告の表示回数などを持つテーブル

### ads_ids
広告の ID 一覧を 1 項目として持つテーブル
- Partition key: dummy (Number)
    - 0 の 1 つだけがある
- 属性
    - ads の ID の一覧 (StringSet)

### ads_contents
広告の情報をもつテーブル
- Partition key: ads_id (String)
- 属性
    - 広告の情報

### counter
記事ごとに，広告の表示・コンバージョン回数をもつテーブル
- Partition key: place_id (String)
- 属性
    - impression (Number)
    - ads (Map<ads_id, ads_count>
        - ads_count
            - c (Number)
            - i (Number)


## Tool
- tool/ 以下にテスト用の Ruby のスクリプトを入れてある

### rest.rb
サンプルとして数行記述してあるが，[REST Client]( https://goo.gl/VXLi32 ) を使って，リクエストを作成している．


## TODO
- Item の更新などのリクエストに認証を付ける
    - Header に認証用の Token を入れるという話だったがまだできていない
- リファクタリング
    - 同じような関数の共通化をしたい
    - Response の値を正しくする
- 不要な広告の削除 (compaction)
    - 要らなくなった広告は現状 ads_ids テーブルから項目を消すことで対処しているが，counter からも消したほうが良い
    - NOTE: この処理は，counter のすべての項目から属性 (ads) を削除する必要があるため，あまり頻度を多くしたくない
    - NOTE: この処理をしないと，counter テーブルの項目が大きくなった時に，料金が高くなる
        - 1 項目について，write は 1KB 単位，read は 4KB 単位で課金額が線形に伸びる
- キャッシュ
    - 取得した項目をキャッシュしておきたい
    - NOTE: DynamoDB では操作する項目の数に比例した課金体系であるので，多くの項目に触ることはできるだけ減らしたほうが良い

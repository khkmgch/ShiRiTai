class Card{
    // "id" :　番号(String)
    // "title" :　タイトル(String)
    // "answer" : 回答(String)
    // "categoryId" : カテゴリの番号(String)
    // "detailShow" : 詳細の表示、非表示の値(Boolean)
    // "completed" : 完了、未完了の値(Boolean)
    // "favorited" : お気に入りかどうか(Boolean)
    // "date" : 作成日(String)
    constructor(id, title, answer, categoryId, date){
        this.data = {
            "id" : id,
            "title" : title,
            "answer" : answer,
            "categoryId" : categoryId,
            "detailShow" : false,
            "completed" : false,
            "favorited" : false,
            "date" : date
        }
        this.next = null;
        this.prev = null;
    }
}
//両端キュー
class Deque{
    constructor(){
        this.head = null;
        this.tail = null;
    }
    //リストの先頭のデータを返す。O(1)
    peekFront(){
        if(this.head == null) return null;
        return this.head.data;
    }
    //リストの末尾のデータを返す。O(1)
    peekBack(){
        if(this.tail == null) return this.peekFront();
        return this.tail.data;
    }
    //リストの先頭に挿入。O(1)
    enqueueFront(newNode){
        if(this.head == null){
            this.head = newNode;
            this.tail = this.head;
        }
        else{
            let node = newNode;
            this.head.prev = node;
            node.next = this.head;
            this.head = node;
        }
    }
    //リストの末尾に挿入。O(1)
    enqueueBack(newNode){
        if(this.head == null){
            this.head = newNode;
            this.tail = this.head;
        }
        else{
            let node = newNode;
            this.tail.next = node;
            node.prev = this.tail;
            this.tail = node;
        }
    }
    //リストの先頭を削除し、削除した要素のデータを返す。O(1)
    dequeueFront(){
        if(this.head == null) return null;

        let temp = this.head;
        this.head = this.head.next;
        if(this.head != null) this.head.prev = null;
        else this.tail = null;
        return temp.data;
    }
    //リストの末尾を削除し、削除した要素のデータを返す。O(1)
    dequeueBack(){
        if(this.tail == null) return null;

        let temp = this.tail;
        this.tail = this.tail.prev;

        //update the tail
        if(this.tail != null) this.tail.next = null;
        else this.head = null;
        return temp.data;
    }
    //idで要素を探す
    findById(id){
        let iterator = this.head;
        while(iterator != null){
            if(iterator.data.id == id){
                return iterator;
            }
            iterator = iterator.next;
        }
        return null;
    }
    //受け取った要素(node)をO(1)で削除する。
    deleteNode(node){
        if(node === this.tail) return this.dequeueBack();
        if(node === this.head) return this.dequeueFront();

        node.prev.next = node.next;
        node.next.prev = node.prev;
    }
}
class Config{
    //Cardの連結リストCards
    static Cards = new Deque();
    //カテゴリの連想配列
    static Categories = {
        // "categoryId" : {
        //     "name" : "",
        //     "color" : ""
        // }
    }
    static Trash = new Deque();
    static Chart = null;
}
//Vueインスタンスを作成
var app = new Vue({
    el: '#app',
    data: {
        //オブジェクトはリアクティブでないので、
        //Config.Cards、Config.Categories、Config.Trashの要素は配列に格納するようにする

        //カードのオブジェクトの配列
        cardsArray: [],
        //カテゴリのオブジェクトの配列
        //[["categoryId", {"name" : "", "color" : ""}]]
        categoriesArray: [],
        //ゴミ箱に入っているカードのオブジェクトの配列
        trashArray: [],
        //スタイル変更セクションの表示、非表示の状態
        isShow_StyleChange: false,
        //グラフセクションの表示、非表示の状態
        isShow_Gragh: false,
        //カード検索で選択された値(カテゴリのid)
        selectedCategory_CardSearch: "all",
        //カード検索で選択された値("all" or "done" or "notYet")
        selectedComplete_CardSearch: "all",
        //カード検索で選択された値("all" or "favorite")
        selectedFavorite_CardSearch: "all",
        //カード検索で入力されたキーワード
        keyword_CardSearch: "",
        //カード作成セクションで選択されたカテゴリのid
        selectedCategory_CardCreate: "",
        //スタイル変更セクションで選択されたカテゴリのid
        selectedCategory_StyleChange: "",
    },
    created: function () {
        this.loadData();
        this.update_cardsArray();
        this.update_categoriesArray();
    },
    //v-ifやv-forではmethodsではなくcomputedを使う！
    computed: {
        //表示するカードの色を、スタイルで指定する
        cardStyleObject: function(){
            return function(node){
                return{
                    borderColor: Config.Categories[node.data["categoryId"]]["color"],
                }
            }
        },
        //表示するテキストの色を、スタイルで指定する
        textStyleObject: function(){
            return function(node){
                return{
                    color: Config.Categories[node.data["categoryId"]]["color"]
                }
            }
        },
        categories: function(){
            return Config.Categories;
        },
        //選択されたカテゴリの名前を返す
        categoryName: function(){
            if(this.selectedCategory_StyleChange == "")return "";
            else return Config.Categories[this.selectedCategory_StyleChange]["name"];
        },
        //選択されたカテゴリのカラーを返す
        categoryColor: function(){
            if(this.selectedCategory_StyleChange == "")return "#000000";
            else return Config.Categories[this.selectedCategory_StyleChange]["color"];
        },
        //カードの詳細を表示する
        expandClick: function(){
            return function(node){
                let value = node.data["detailShow"];
                if(value){
                    Config.Cards.findById(node.data["id"]).data["detailShow"] = false;
                }else{
                    Config.Cards.findById(node.data["id"]).data["detailShow"] = true;
                }
                this.update_cardsArray();
            }
        },
        //カードの解決済、未解決の状態を変更する
        completeCheck: function(){
            return function(node){
                if(node.data["completed"]){
                    Config.Cards.findById(node.data["id"]).data["completed"] = false;
                }
                else Config.Cards.findById(node.data["id"]).data["completed"] = true;

                this.update_cardsArray();
            }
        },
        //カードをお気に入りする
        favorite: function(){
            return function(node){
                if(node.data["favorited"]){
                    Config.Cards.findById(node.data["id"]).data["favorited"] = false;
                }
                else Config.Cards.findById(node.data["id"]).data["favorited"] = true;

                this.update_cardsArray();
            }
        },
        //カードをゴミ箱に移す
        throwAway: function(){
            return function(node){
                let curr = Config.Cards.findById(node.data["id"]);
                Config.Cards.deleteNode(curr);
                Config.Trash.enqueueBack(curr);

                this.update_cardsArray();
                this.update_trashArray();
            }
        },
        //カードのテキストの編集内容を、Cardsのデータに反映する
        answerEdit: function(){
            return function(node){
                let value = event.currentTarget.value;
                Config.Cards.findById(node.data["id"]).data["answer"] = value;
                this.update_cardsArray();
            }
        },
    },
    methods: {
        //localStorageにデータを保存する
        dataSave: function(){
            //JSONは両端キューなどの循環する構造のデータを扱えないので、
            //Config.CardsとConfig.Trashの要素の.nextと.prevをnullにしながら
            //配列に格納して保存できる形式にする
            let saveData = {
                "cards" : [],
                "categories" : Config.Categories,
                "trash" : []
            };
            let i = 0;
            let iterator = Config.Cards.head;
            while(iterator != null){
                saveData["cards"][i] = iterator;
                iterator = iterator.next;
                saveData["cards"][i].next = null;
                saveData["cards"][i].prev = null;
                i++;
            }
            iterator = Config.Trash.head;
            i = 0;
            while(iterator != null){
                saveData["trash"][i] = iterator;
                iterator = iterator.next;
                saveData["trash"][i].next = null;
                saveData["trash"][i].prev = null;
                i++;
            }
            let saveDataString = JSON.stringify(saveData);
            localStorage.setItem("saveData", saveDataString);
        },
        alert_DataSave(){
            alert("データを保存しました。");
        },
        //localStorageからデータを削除する
        dataReset: function(){
            if(localStorage.getItem("saveData") != null){
                localStorage.removeItem("saveData");
                alert("データをリセットしました。");
            }
            Config.Cards = new Deque();
            Config.Categories = {};
            Config.Trash = new Deque();
            this.update_cardsArray();
            this.update_categoriesArray();
            this.update_trashArray();
        },
        //localStorageからデータを読み込む
        loadData: function(){
            let saveDataString = localStorage.getItem("saveData");
            if(saveDataString != null){
                let saveData = JSON.parse(saveDataString);
                //Config.Cardsを初期化
                for(let i = 0; i < saveData["cards"].length; i++){
                    let curr = saveData["cards"][i];
                    Config.Cards.enqueueBack(curr);
                }
                //Config.Categoriesを初期化
                Config.Categories = saveData["categories"];
                //Config.Trashを初期化
                for(let i = 0; i < saveData["trash"].length; i++){
                    let curr = saveData["trash"][i];
                    Config.Trash.enqueueBack(curr);
                }
            }
        },
        //cardsArrayを更新する
        update_cardsArray: function(){
            this.cardsArray.splice(0);
            let i = 0;
            let iterator = Config.Cards.head;
            while(iterator != null){
                //入力された検索条件で絞り込む
                if(this.narrowDown(iterator)){
                    this.cardsArray.splice(i,1,iterator);
                    i++;
                }
                iterator = iterator.next;
            }
        },
        //categoriesArrayを更新する
        update_categoriesArray: function(){
            this.categoriesArray.splice(0);
            let i = 0;
            for(let key in Config.Categories){
                this.categoriesArray.splice(i,1,[key, Config.Categories[key]]);
                i++;
            }
        },
        //trashArrayを更新する
        update_trashArray: function(){
            this.trashArray.splice(0);
            let i = 0;
            let iterator = Config.Trash.head;
            while(iterator != null){
                this.trashArray.splice(i,1,iterator);
                i++;
                iterator = iterator.next;
            }
        },
        //カードを新規作成する
        createCard(){
            let form = event.currentTarget;
            let categoryId = this.selectedCategory_CardCreate;
            //カテゴリを新規作成する場合
            if(categoryId == "new"){
                let categoryName = form.querySelector(".input-categoryName").value;
                if(categoryName == ""){
                    alert("カテゴリ名を入力してください。")
                    return null;
                }
                let categoryColor = form.querySelector(".input-categoryColor").value;
                categoryId = this.createCategory(categoryName, categoryColor);
            }
            //カードタイトルを取得
            let title = form.querySelector(".input-title").value;
            //カードのidを割り当てる
            let id = Config.Cards.peekBack() != null ? Config.Cards.peekBack().id + 1 : 1;
            //作成日
            let date = new Date();
            let dateString = `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
            //カードのインスタンスを作成
            let card = new Card(id, title, "", categoryId, dateString);
            //Config.Cards(両端キュー)の末尾に追加
            Config.Cards.enqueueBack(card);
            //カードの配列を更新
            this.update_cardsArray();
            //グラフを描画
            this.drawChart();

            //入力フォームをリセット
            if(this.selectedCategory_CardCreate == "new"){
                form.querySelector(".input-categoryName").value = "";
                form.querySelector(".input-categoryColor").value = "#000000";
            }
            form.querySelector(".input-title").value = "";
            this.selectedCategory_CardCreate = "";
        },
        //カテゴリを新規作成する(String)
        createCategory(name, color){
            let id = !Object.keys(Config.Categories).length ? "1" : (Object.keys(Config.Categories).length + 1).toString();
            Config.Categories[id] = {
                name : name,
                color : color
            }
            this.update_categoriesArray();
            return id;
        },
        //スタイル変更のセクションで、選択したカテゴリに対応するカテゴリ名とカラーを表示する
        switchCategory(){
            let changeStyleSec = document.getElementById("style-change");
            let id = this.selectedCategory_StyleChange;
            changeStyleSec.querySelector(".input-categoryName").value = Config.Categories[id]["name"];
            changeStyleSec.querySelector(".input-categoryColor").value = Config.Categories[id]["color"];
        },
        //カテゴリ名とカラーを変更する
        changeCategory(){
            let changeStyleSec = document.getElementById("style-change");
            let name = changeStyleSec.querySelector(".input-categoryName").value;
            let color = changeStyleSec.querySelector(".input-categoryColor").value;
            Config.Categories[this.selectedCategory_StyleChange] = {
                name : name,
                color : color
            }
            this.update_categoriesArray();
        },
        //カテゴリとキーワードで表示するカードを絞り込む(boolean)
        narrowDown: function(node){
            let id = this.selectedCategory_CardSearch;
            let complete = this.selectedComplete_CardSearch;
            let favorite = this.selectedFavorite_CardSearch;
            let keyword = this.keyword_CardSearch;
            if(id == "all"){
                return this.idValid_ByComplete_Favorite_Keyword(node, complete, favorite, keyword);
            }else{
                if(node.data["categoryId"] != id)return false;
                else return this.idValid_ByComplete_Favorite_Keyword(node, complete, favorite, keyword);
            }
        },
        //カードを、complete,favorite,keywordによって判定する(narrowDown()内で使用する)(boolean)
        idValid_ByComplete_Favorite_Keyword: function(node, complete, favorite, keyword){
            if(favorite == "favorite" && !node.data["favorite"])return false;
            
            if(complete == "all"){
                return !(keyword != "" && node.data["title"].indexOf(keyword) == -1);
            }else if(complete == "done"){
                return !(!node.data["completed"] || (keyword != "" && node.data[title].indexOf(keyword) == -1));
            }else{
                return !(node.data["completed"] || (keyword != "" && node.data[title].indexOf(keyword) == -1));
            }
        },
        //カードがクリックされた時、カードのサイズを切り替える
        expandSwitch: function(){
            let parent = event.currentTarget.parentElement.parentElement.parentElement;
            let nextWidth = parent.parentElement.clientWidth - 20;
            if(parent.value){
                //画面サイズによってカードのサイズを決定
                if(window.innerWidth >= 992)nextWidth = parent.parentElement.clientWidth/4 - 20;
                else if(window.innerWidth >= 768)nextWidth = parent.parentElement.clientWidth/2 - 20;
                parent.value = false;
            }else{
                parent.value = true;
            }
            parent.style.width = nextWidth;
        },
        //テキスト編集をオンにする
        editOn: function(){
            let textarea = event.currentTarget.parentElement.parentElement.querySelector("textarea");
            textarea.disabled = false;
        },
        //スタイル変更セクションの表示、非表示を切り替える
        switchView_StyleChange: function(){
            if(this.isShow_StyleChange)this.isShow_StyleChange = false;
            else this.isShow_StyleChange = true;
        },
        //ステータスグラフの表示、非表示を切り替える
        switchView_Gragh: function(){
            if(this.isShow_Gragh)this.isShow_Gragh = false;
            else this.isShow_Gragh = true;
            
            this.$nextTick(function(){
                //グラフを描画
                this.drawChart();
            })
        },
        //円グラフを描画する
        drawChart: function(){
            if(Config.Chart != null)Config.Chart.destroy();
            if(this.isShow_Gragh && Object.keys(Config.Categories).length !== 0){
                let hashmap = {
                    // "categoryId" : カテゴリのカードの数
                };
                for(let i = 0; i < this.categoriesArray.length; i++){
                    //curr = ["categoryId", {"name" : "", "color" : ""}]
                    let curr = this.categoriesArray[i];
                    hashmap[curr[0]] = 0;
                }
                let i = 0;
                let iterator = Config.Cards.head;
                while(iterator != null){
                    hashmap[iterator.data["categoryId"]] += 1;
                    i++;
                    iterator = iterator.next;
                }
                //カードの合計枚数
                let cardsTotal = i;
                
                let dataArr = [];
                let backgroundColorArr = [];
                let labelArr = [];
                for(let key in hashmap){
                    dataArr.push(hashmap[key]);
                    backgroundColorArr.push(Config.Categories[key]["color"]);
                    labelArr.push(Config.Categories[key]["name"]);
                }
                let canvas = this.$refs.chart;
                Config.Chart = new Chart(canvas, {
                    type: 'doughnut',
                    data: {
                        datasets: [{
                            data: dataArr,
                            backgroundColor: backgroundColorArr,
                            hoverOffset: 5,
                        }],
                        labels: labelArr,
                    },
                    options: {
                        cutout: "60%",
                        layout: {
                            padding: {
                                left: 50,
                                right: 50,
                                top: 50,
                                bottom: 50
                            }
                        },
                        plugins: {
                            legend: {
                                display: false
                            },
                            tooltip: {
                                bodyFont: {
                                    size: 25
                                },
                                callbacks: {
                                    label: function (tooltipItem){
                                        return ` ${tooltipItem.label} : ${Math.floor(tooltipItem.raw / cardsTotal * 100)}% (${tooltipItem.raw}枚)`;
                                    }
                                }
                            }
                        }
                    }
                });
            }
        }
    }
})

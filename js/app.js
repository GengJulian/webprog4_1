const select = document.getElementById("select-article");
const minCheck = document.getElementById("min-check");
const range = document.getElementById("form-control-range");

const btnScrollStart = document.getElementById("btn-scroll-start");
const btnScrollEnd = document.getElementById("btn-scroll-end");
const btnScrollPrev = document.getElementById("btn-scroll-prev");
const btnScrollNext = document.getElementById("btn-scroll-next");

const precison = document.getElementById("precison");
const recall = document.getElementById("recall");

let processedData = [];
let recommendedData = [];
let originalData = [];
let originalSpecData = [];

let isMinChecked = false;
let probability = 0.5;

let selectStart = 0;
let offset = 20;

const setProbability = function(value){
    probability = value;
    document.getElementById("range-value").textContent = value;
}

const fetchData = function(url = "data.txt"){
    fetch(url)
        .then((response) => response.text())
        .then((text) => text.split('\n'))
        .then((text) => text.map(line => line.split('$$$')))
        .then((text) => {
          let article = {};
          let index = 0;
          text.forEach((line) =>{
              article.recommended = line[0];
              article.recommendedSpec = line[1];
              article.original = line[2];
              article.title = line[3];
              article.text = line[4];
              index++;
              article.id = index;
              //console.log(article);
              processedData.push(article);
              article = {};
          });
          //console.log(processedData);
          insertOptions();  
        });
};

const insertOptions = function(){
    select.innerHTML = "";
    processedData.map(function(data, index){
        if(index >= selectStart && index < (selectStart + offset)){
            
            let option = document.createElement("option");
            option.textContent = data.title;
            option.value = data.title;
            select.appendChild(option);
            //console.log(option);
           //console.log(data.title);
           //console.log(data.text);
        }
    });
    select.selectedIndex = 0;
    //console.log(select.value);
    onOptionChange(select.value);
}

const onOptionChange = function(title){
    const option = processedData.find((article) => article.title == title);
    //console.log(option);
    processSelectedOption(option);
}

const processSelectedOption = function(option){
    recommendedData = [];
    recommendedSpecData = [];
    originalData = [];
    originalSpecData = [];
    let article = {};

    const recommended = option.recommended.split(' ');
    const recommendedSpec = option.recommendedSpec.split(' ');
    const original = option.original.split(' ');
    const text = option.text;

    /*
    console.log(recommended);
    console.log(recommendedSpec);
    console.log(original);
    console.log(text);
    */
    for(let i = 0; i < recommended.length;i++){
        if(recommended[i].trim().startsWith("__label__")){
            article.label = recommended[i].replace("__label__","").replace(/@{2}/g,"__");
        }else if(recommended[i] != ""){
            article.probability = recommended[i].trim();
            recommendedData.push(article);
            article = {};
        }
    }

    //console.log(recommendedData);
    
    for(let i = 0; i < recommendedSpec.length;i++){
        if(recommendedSpec[i].trim().startsWith('__label__')){
            article.label = recommendedSpec[i].replace("__label__","").replace(/@{2}/g,"__");
        }else if(recommendedSpec[i] != ""){
            article.probability = recommendedSpec[i].trim();
            recommendedSpecData.push(article);
            article = {};
        }
    }

    //console.log(recommendedSpecData);
    
    for(let i = 0; i < original.length;i++){
        if(original[i].trim().startsWith('__label__')){
            article.label = original[i].replace("__label__","").replace(/@{2}/g,"__");
            originalData.push(article);
            article = {};
        }else if(original[i] != ""){
            article.label = original[i].replace(/@{2}/g,"__");
            originalSpecData.push(article);
            article = {};
        }
    }

    //console.log(originalSpecData);

    
    insertArticleText("text-content", text);
    insertLabels();
}

const insertLabels = function(){
    insertArticleLabels("original-labels",originalData);
    insertArticleLabels("recommended-labels", recommendedData);
    insertArticleLabels("recommended-spec-labels", recommendedSpecData);
    insertArticleLabels("original-spec-labels", originalSpecData);
    precison.textContent = calculateNumberOfHits()/recommendedData.length;
    recall.textContent = calculateNumberOfHits()/originalData.length;
}

const insertArticleText = function(nodeId,text){
    const node = document.getElementById(nodeId);
    if(text.length > 550){
        node.innerHTML = `${text.substr(0, text.indexOf(".",550))}...`;
    }else{
        node.innerHTML = text;
    }
}

const insertArticleLabels = function(nodeId,labels){
    const labelsNode = document.getElementById(nodeId);
    labelsNode.innerHTML = "";
    if(isMinChecked){
        for(let i=0;i<labels.length && i < 3;i++){
            labelsNode.appendChild(createLabelListItem(labels[i]));
        }

        for(let i=3;i<labels.length;i++){
            if(labels[i].probability !== undefined){
                if(labels[i].probability >= probability){
                    labelsNode.appendChild(createLabelListItem(labels[i]));
                }
            }else{
                labelsNode.appendChild(createLabelListItem(labels[i]));
            }

        }
    }else{
        for(let i=0;i<labels.length;i++){
            if(labels[i].probability !== undefined){
                if(labels[i].probability >= probability){
                    labelsNode.appendChild(createLabelListItem(labels[i]));
                }
            }else{
                labelsNode.appendChild(createLabelListItem(labels[i]));
            }

        }
    }
}

const createLabelListItem = function(label){
    let labelItem = document.createElement('li');
    if(label.probability !== undefined){
        labelItem.textContent = `${label.label} (${label.probability})`;
    }else{
        labelItem.textContent = label.label;
    }
    return labelItem;
}

const calculateNumberOfHits = function(){
    let numberOfHits = 0;
    for(let i=0;i<recommendedData.length;i++){
        if(recommendedData[i].probability !== undefined){
            if(recommendedData[i].probability >= probability){
                numberOfHits++;
            }
        }
    }
    

    for(let i=0;i<recommendedSpecData.length;i++){
        if(recommendedSpecData[i].probability !== undefined){
            if(recommendedSpecData[i].probability >= probability){
                numberOfHits++;
            }
        }
    }



    return numberOfHits;
}


select.addEventListener("change",function(e){
    onOptionChange(e.target.value);
});

minCheck.addEventListener("change", function(){
    isMinChecked = !isMinChecked;
    insertLabels();
});

range.addEventListener("input",function(e){
    setProbability(e.target.value);
    insertLabels();
});

btnScrollStart.addEventListener("click",function(){
    selectStart = 0;
    insertOptions();
});

btnScrollPrev.addEventListener("click",function(){
    selectStart = selectStart - 20;
    if(selectStart < 0){
        selectStart = processedData.length - 20;
    }
    insertOptions();
});

btnScrollNext.addEventListener("click",function(){
    selectStart = selectStart + 20;
    insertOptions();
})

btnScrollEnd.addEventListener("click",function(){
    selectStart = processedData.length - 20;
    insertOptions();
});

(() => {
    fetchData();
    setProbability(range.value);
})();




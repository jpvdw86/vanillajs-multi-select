let VSBoxCounter = function () {
    let count = 0;
    let instances = [];
    return {
        set: function (instancePtr) {
            instances.push({ offset: ++count, ptr: instancePtr });
            return instances[instances.length - 1].offset;
        },
        remove: function (instanceNr) {
            let temp = instances.filter(function (x) {
                return x.offset !== instanceNr;
            })
            instances = temp.splice(0);
        },
        closeAllButMe: function (instanceNr) {
            instances.forEach(function (x) {
                if (x.offset !== instanceNr) {
                    x.ptr.closeOrder();
                }
            });
        }
    };
}();

export function VanillaJsMultiSelectBox(element, options) {
    let self = this;
    this.instanceOffset = VSBoxCounter.set(self);
    this.root = element;
    this.rootToken = null;
    this.main;
    this.button;
    this.title;
    this.isMultiple = this.root.hasAttribute("multiple");
    this.multipleSize = this.isMultiple && this.root.hasAttribute("size") ? parseInt(this.root.getAttribute("size")) : -1;
    this.isOptgroups = false;
    this.currentOptgroup = 0;
    this.drop;
    this.top;
    this.left;
    this.options;
    this.listElements;
    this.isDisabled = false;
    this.search = false;
    this.searchZone = null;
    this.inputBox = null;
    this.disabledItems = [];
    this.ulminHeight = 25;
    this.maxOptionWidth = Infinity;
    this.maxSelect = Infinity;
    this.isInitRemote = false;
    this.isSearchRemote = false;
    this.onInit = null;
    this.onSearch = null; // if isRemote is true : a user defined function that loads more options from the back
    this.onInitSize = null;
    this.forbidenAttributes = ["class", "selected", "disabled", "data-text", "data-value"];
    this.forbidenClasses = ["active", "disabled"];
    this.userOptions = {
        maxWidth: 500,
        minWidth: -1,
        maxHeight: 400,
        translations: { "all": "All", "items": "items", "selectAll": "Select All", "clearAll": "Clear All" },
        search: false,
        placeHolder: "",
        stayOpen: false,
        disableSelectAll: false,
        textColor: "#7a7a7e",
        disableAllMessage: false
    }
    if (options) {
        if (options.maxWidth !== undefined) {
            this.userOptions.maxWidth = options.maxWidth;
        }
        if (options.minWidth !== undefined) {
            this.userOptions.minWidth = options.minWidth;
        }
        if (options.maxHeight !== undefined) {
            this.userOptions.maxHeight = options.maxHeight;
        }
        if (options.textColor !== undefined) {
            this.userOptions.textColor = options.textColor;
        }
        if (options.translations !== undefined) {
            for (var property in options.translations) {
                if (options.translations.hasOwnProperty(property)) {
                    if (this.userOptions.translations[property]) {
                        this.userOptions.translations[property] = options.translations[property];
                    }
                }
            }
        }
        if (options.placeHolder !== undefined) {
            this.userOptions.placeHolder = options.placeHolder;
        }
        if (options.search !== undefined) {
            this.search = options.search;
        }
        if (options.title !== undefined) {
            this.title = options.title;
        }
        if (options.remote !== undefined && options.remote) {

            // user defined onInit  function
            if (options.remote.onInit !== undefined && typeof options.remote.onInit === 'function') {
                this.onInit = options.remote.onInit;
                this.isInitRemote = true;
            }
            if (options.remote.onInitSize !== undefined) {
                this.onInitSize = options.remote.onInitSize;
                if (this.onInitSize < 3) this.onInitSize = 3;
            }
            // user defined remote search function
            if (options.remote.onSearch !== undefined && typeof options.remote.onSearch === 'function') {
                this.onSearch = options.remote.onSearch;
                this.isSearchRemote = true;
            }
        }

        if (options.stayOpen !== undefined) {
            this.userOptions.stayOpen = options.stayOpen;
        }

        if (options.disableSelectAll !== undefined) {
            this.userOptions.disableSelectAll = options.disableSelectAll;
        }

        if (options.disableAllMessage !== undefined) {
            this.userOptions.disableAllMessage = options.disableAllMessage;
        }

        if (options.maxSelect !== undefined && !isNaN(options.maxSelect) && options.maxSelect >= 1) {
            this.maxSelect = options.maxSelect;
            this.userOptions.disableSelectAll = true;
        }

        if (options.maxOptionWidth !== undefined && !isNaN(options.maxOptionWidth) && options.maxOptionWidth >= 20) {
            this.maxOptionWidth = options.maxOptionWidth;
        }
    }

    this.closeOrder = function () {
        let self = this;
        if (!self.userOptions.stayOpen) {
            self.drop.classList.remove("show");
            if (self.search) {
                self.inputBox.value = "";
                Array.prototype.slice.call(self.listElements).forEach(function (x) {
                    x.classList.remove("hide");
                });
            }
        }
    }

    this.init = function () {
        let self = this;
        if (self.isInitRemote) {
            self.onInit("",self.onInitSize)
                .then(function (data) {
                    self.buildSelect(data);
                    self.createTree();
                });
        } else {
            self.createTree();
        }
    }

    this.createTree = function () {

        this.rootToken = this.root.id+"-multi-selectbox"
        this.root.style.display = "none";
        let already = document.getElementById("btn-group-" + this.rootToken);
        if (already) {
            already.remove();
        }
        this.main = document.createElement("div");
        this.root.parentNode.insertBefore(this.main, this.root.nextSibling);
        this.main.classList.add("form-control");
        this.main.classList.add("form-select");
        this.main.classList.add("multi-selectbox");
        this.main.setAttribute("id", "btn-group-" + this.rootToken);
        if (self.userOptions.stayOpen) {
            this.main.style.minHeight = (this.userOptions.maxHeight + 10) + "px";
        }

        if (self.userOptions.stayOpen) {
            this.button = document.createElement("div");
        } else {
            this.button = document.createElement("button");
        }
        this.main.appendChild(this.button);
        this.title = document.createElement("span");
        this.button.appendChild(this.title);
        this.title.classList.add("title");
        this.drop = document.createElement("div");
        this.main.appendChild(this.drop);

        this.drop.classList.add("dropdown-menu");

        this.drop.style.zIndex = 2000 - this.instanceOffset;

        this.ul = document.createElement("ul");
        this.drop.appendChild(this.ul);
        // this.ul.classList.add('')
        this.ul.style.maxHeight = this.userOptions.maxHeight + "px";
        this.ul.style.minWidth = (this.main.offsetWidth - 25) + "px";
        // this.ul.style.maxWidth = this.root.offsetWidth + "px";
        // this.ul.style.maxWidth = this.ulmaxWidth + "px";
        this.ul.style.minHeight = this.ulminHeight + "px";
        if (this.isMultiple) {
            this.ul.classList.add("multi");
            if (!self.userOptions.disableSelectAll) {
                let selectAll = document.createElement("option");
                selectAll.classList.add("toggle")
                selectAll.setAttribute("value", 'all');
                selectAll.innerText = self.userOptions.translations.selectAll;
                this.root.insertBefore(selectAll, (this.root.hasChildNodes())
                    ? this.root.childNodes[0]
                    : null);
            }
        }
        let selectedTexts = ""
        let sep = "";
        let nrActives = 0;

        if (this.search) {
            this.searchZone = document.createElement("div");
            this.ul.appendChild(this.searchZone);
            this.searchZone.style.zIndex = 2001 - this.instanceOffset;
            this.inputBox = document.createElement("input");
            this.searchZone.appendChild(this.inputBox);
            this.inputBox.setAttribute("type", "text");
            this.inputBox.setAttribute("id", "search_" + this.rootToken);
            this.inputBox.classList.add('form-control');
            if (this.maxOptionWidth < Infinity) {
                this.searchZone.style.maxWidth = self.maxOptionWidth + 30 + "px";
                this.inputBox.style.maxWidth = self.maxOptionWidth + 30 + "px";
            }

            this.ul.addEventListener("scroll", function (e) {
                const y = this.scrollTop;
                self.searchZone.parentNode.style.top = y + "px";
            });
        }

        this.options = this.root.options;
        Array.prototype.slice.call(this.options).forEach(function (x) {
            let text = x.textContent;
            let value = x.value;
            let originalAttrs;
            if (x.hasAttributes()) {
                originalAttrs = Array.prototype.slice.call(x.attributes)
                    .filter(function (a) {
                        return self.forbidenAttributes.indexOf(a.name) === -1
                    });
            }
            let classes = x.getAttribute("class");
            if (classes) {
                classes = classes
                    .split(" ")
                    .filter(function (c) {
                        return self.forbidenClasses.indexOf(c) === -1
                    });
            } else {
                classes = [];
            }
            let li = document.createElement("li");
            let isSelected = x.hasAttribute("selected");
            let isDisabled = x.hasAttribute("disabled");

            self.ul.appendChild(li);
            li.classList.add('dropdown-item')
            li.setAttribute("data-value", value);
            li.setAttribute("data-text", text);

            if (originalAttrs !== undefined) {
                originalAttrs.forEach(function (a) {
                    li.setAttribute(a.name, a.value);
                });
            }

            classes.forEach(function (x) {
                li.classList.add(x);
            });

            if (self.maxOptionWidth < Infinity) {
                li.classList.add("short");
                li.style.maxWidth = self.maxOptionWidth + "px";
            }

            if (isSelected) {
                nrActives++;
                selectedTexts += sep + text;
                sep = ",";
                li.classList.add("active");
                if (!self.isMultiple) {
                    self.title.textContent = text;
                    if (classes.length !== 0) {
                        classes.forEach(function (x) {
                            self.title.classList.add(x);
                        });
                    }
                }
            }
            if (isDisabled) {
                li.classList.add("disabled");
            }
            li.appendChild(document.createTextNode(" " + text));
        });

        if (this.root.getElementsByTagName('optgroup') !== null) {
            self.isOptgroups = true;
            self.options = this.root.options;
            let groups = this.root.getElementsByTagName('optgroup');
            Array.prototype.slice.call(groups).forEach(function (group) {
                let groupOptions = group.querySelectorAll('option');
                let li = document.createElement("li");
                let span = document.createElement("span");
                let iCheck = document.createElement("i");
                let labelElement = document.createElement("b");
                let dataWay = group.getAttribute("data-way");
                if (!dataWay) dataWay = "closed";
                if (!dataWay || (dataWay !== "closed" && dataWay !== "open")) dataWay = "closed";
                li.appendChild(span);
                li.appendChild(iCheck);
                self.ul.appendChild(li);
                li.classList.add('grouped-option');
                li.classList.add(dataWay);
                self.currentOptgroup++;
                let optId = self.rootToken + "-opt-" + self.currentOptgroup;
                li.id = optId;
                li.appendChild(labelElement);
                labelElement.appendChild(document.createTextNode(group.label));
                li.setAttribute("data-text", group.label);
                self.ul.appendChild(li);

                Array.prototype.slice.call(groupOptions).forEach(function (x) {
                    let text = x.textContent;
                    let value = x.value;
                    let classes = x.getAttribute("class");
                    if (classes) {
                        classes = classes.split(" ");
                    }
                    else {
                        classes = [];
                    }
                    classes.push(dataWay);
                    let li = document.createElement("li");
                    let isSelected = x.hasAttribute("selected");
                    self.ul.appendChild(li);
                    li.setAttribute("data-value", value);
                    li.setAttribute("data-text", text);
                    li.setAttribute("data-parent", optId);
                    if (classes.length != 0) {
                        classes.forEach(function (x) {
                            li.classList.add(x);
                        });
                    }
                    if (isSelected) {
                        nrActives++;
                        selectedTexts += sep + text;
                        sep = ",";
                        li.classList.add("active");
                        if (!self.isMultiple) {
                            self.title.textContent = text;
                            if (classes.length !== 0) {
                                classes.forEach(function (x) {
                                    self.title.classList.add(x);
                                });
                            }
                        }
                    }
                    li.appendChild(document.createTextNode(text));
                })
            })
        }

        let optionsLength = self.options.length - Number(!self.userOptions.disableSelectAll);

        if (optionsLength === nrActives && self.userOptions.disableAllMessage === false) { // Bastoune idea to preserve the placeholder
            selectedTexts = self.userOptions.translations.all || "all";
        } else if (self.multipleSize != -1) {
            if (nrActives > self.multipleSize) {
                let wordForItems = self.userOptions.translations.items || "items"
                selectedTexts = nrActives + " " + wordForItems;
            }
        }
        if (self.isMultiple) {
            if (self.userOptions.placeHolder !== ""){
                self.title.innerHTML = self.userOptions.placeHolder + ": "+selectedTexts;
            } else {
                self.title.innerHTML = selectedTexts;
            }
        }
        if (self.userOptions.placeHolder !== "" && self.title.textContent === "") {
            self.title.textContent = self.userOptions.placeHolder;
        }
        self.listElements = self.drop.querySelectorAll("li:not(.grouped-option)");
        if (self.search) {
            self.inputBox.addEventListener("keyup", function (e) {
                let searchValue = e.target.value.toUpperCase();
                let searchValueLength = searchValue.length;
                let nrFound = 0;
                let nrChecked = 0;
                let selectAll = null;
                if (self.isSearchRemote) {
                    if (searchValueLength === 0) {
                        self.remoteSearchIntegrate(null);
                    } else if (searchValueLength >= 1) {
                        self.onSearch(searchValue)
                            .then(function (data) {
                                self.remoteSearchIntegrate(data);
                            });
                    }
                } else {
                    if (searchValueLength < 1) {
                        Array.prototype.slice.call(self.listElements).forEach(function (x) {
                            if (x.getAttribute('data-value') === 'all') {
                                selectAll = x;
                            } else {
                                x.classList.remove("hidden-search");
                                nrFound++;
                                nrChecked += x.classList.contains('active');
                            }
                        });
                    } else {
                        Array.prototype.slice.call(self.listElements).forEach(function (x) {
                            if (x.getAttribute('data-value') !== 'all') {
                                let text = x.getAttribute("data-text").toUpperCase();
                                if (text.indexOf(searchValue) === -1 && x.getAttribute('data-value') !== 'all') {
                                    x.classList.add("hidden-search");
                                } else {
                                    nrFound++;
                                    x.classList.remove("hidden-search");
                                    nrChecked += x.classList.contains('active');
                                }
                            } else {
                                selectAll = x;
                            }
                        });
                    }
                    if (selectAll) {
                        if (nrFound === 0) {
                            selectAll.classList.add('disabled');
                        } else {
                            selectAll.classList.remove('disabled');
                        }
                        if (nrChecked !== nrFound) {
                            selectAll.classList.remove("active");
                            selectAll.innerText = self.userOptions.translations.selectAll;
                            selectAll.setAttribute('data-selected', 'false')
                        } else {
                            selectAll.classList.add("active");
                            selectAll.innerText = self.userOptions.translations.clearAll;
                            selectAll.setAttribute('data-selected', 'true')
                        }
                    }
                }
            });
        }

        if (self.userOptions.stayOpen) {
            self.drop.classList.add("show");
            self.drop.style.boxShadow = "none";
            self.drop.style.minHeight = (this.userOptions.maxHeight + 10) + "px";
            self.drop.style.position = "relative";
            self.drop.style.left = "0px";
            self.drop.style.top = "0px";
            self.button.style.border = "none";
        } else {
            this.main.addEventListener("click", function (e) {
                if (self.isDisabled) return;
                self.drop.style.left = self.left + "px";
                self.drop.style.top = self.top + "px";
                self.drop.classList.add("show");
                document.addEventListener("click", docListener);
                e.preventDefault();
                e.stopPropagation();
                if (!self.userOptions.stayOpen) {
                    VSBoxCounter.closeAllButMe(self.instanceOffset);
                }
            });
        }

        this.drop.addEventListener("click", function (e) {
            if (self.isDisabled) return;
            if (e.target.tagName === 'INPUT') return;
            let isShowHideCommand = e.target.tagName === 'SPAN';
            let isCheckCommand = e.target.tagName === 'I';
            let liClicked = e.target.parentElement;

            if (!liClicked.hasAttribute("data-value")) {
                if (liClicked.classList.contains("grouped-option")) {
                    if (!isShowHideCommand && !isCheckCommand) return;
                    let oldClass, newClass;
                    if (isCheckCommand) { // check or uncheck children
                        self.checkUncheckFromParent(liClicked);
                    } else { //open or close
                        if (liClicked.classList.contains("open")) {
                            oldClass = "open"
                            newClass = "closed"
                        } else {
                            oldClass = "closed"
                            newClass = "open"
                        }
                        liClicked.classList.remove(oldClass);
                        liClicked.classList.add(newClass);
                        let theChildren = self.drop.querySelectorAll("[data-parent='" + liClicked.id + "']");
                        theChildren.forEach(function (x) {
                            x.classList.remove(oldClass);
                            x.classList.add(newClass);
                        })
                    }
                    return;
                }
            }
            let choiceValue = e.target.getAttribute("data-value");
            let choiceText = e.target.getAttribute("data-text");
            let className = e.target.getAttribute("class");

            if (className && className.indexOf("disabled") !== -1) {
                return;
            }

            if (className && className.indexOf("overflow") !== -1) {
                return;
            }

            if (choiceValue === 'all') {
                if (e.target.hasAttribute('data-selected')
                    && e.target.getAttribute('data-selected') === 'true') {
                    self.setValue('none')
                } else {
                    self.setValue('all');
                }
                return;
            }

            if (!self.isMultiple) {
                self.root.value = choiceValue;
                self.title.textContent = choiceText;
                if (className) {
                    self.title.setAttribute("class", className + " title");
                } else {
                    self.title.setAttribute("class", "title");
                }
                Array.prototype.slice.call(self.listElements).forEach(function (x) {
                    x.classList.remove("active");
                });
                if (choiceText !== "") {
                    e.target.classList.add("active");
                }
                self.privateSendChange();
                if (!self.userOptions.stayOpen) {
                    docListener();
                }
            } else {
                let wasActive = false;
                if (className) {
                    wasActive = className.indexOf("active") !== -1;
                }
                if (wasActive) {
                    e.target.classList.remove("active");
                } else {
                    e.target.classList.add("active");
                }
                if (e.target.hasAttribute("data-parent")) {
                    self.checkUncheckFromChild(e.target);
                }

                let selectedTexts = ""
                let sep = "";
                let nrActives = 0;
                let nrAll = 0;
                for (let i = 0; i < self.options.length; i++) {
                    nrAll++;
                    if (self.options[i].value === choiceValue) {
                        self.options[i].selected = !wasActive;
                    }
                    if (self.options[i].selected) {
                        nrActives++;
                        selectedTexts += sep + self.options[i].textContent;
                        sep = ",";
                    }
                }
                if (nrAll === nrActives - Number(!self.userOptions.disableSelectAll) && self.userOptions.disableAllMessage === false) {
                    selectedTexts = self.userOptions.translations.all || "all";
                } else if (self.multipleSize !== -1) {
                    if (nrActives > self.multipleSize) {
                        let wordForItems = self.userOptions.translations.items || "items"
                        selectedTexts = nrActives + " " + wordForItems;
                    }
                }
                if (self.userOptions.placeHolder !== ""){
                    self.title.textContent = self.userOptions.placeHolder + ": "+selectedTexts;
                } else {
                    self.title.textContent = selectedTexts;
                }
                self.checkSelectMax(nrActives);
                self.checkUncheckAll();
                self.privateSendChange();
            }
            e.preventDefault();
            e.stopPropagation();
            if (self.userOptions.placeHolder !== "" && self.title.textContent === "") {
                self.title.textContent = self.userOptions.placeHolder;
            }
        });
        function docListener() {
            document.removeEventListener("click", docListener);
            self.drop.classList.remove("show")
            if (self.search) {
                self.inputBox.value = "";
                Array.prototype.slice.call(self.listElements).forEach(function (x) {
                    x.classList.remove("hidden-search");
                });
            }
        }
    }
    this.init();
    this.checkUncheckAll();
}

VanillaJsMultiSelectBox.prototype.buildSelect = function (data) {
    let self = this;
    if(data == null || data.length < 1) return;
    if(!self.isOptgroups){
        self.isOptgroups = data[0].parent !== undefined && data[0].parent !== "";
    }

    if(self.isOptgroups){
        let groups = {};
        data = data.filter(function(x){
            return x.parent !== undefined && x.parent !== "";
        });

        data.forEach(function (x) {
            if(!groups[x.parent]){
                groups[x.parent] = true;
            }
        });
        for (let group in groups) {
            let anOptgroup = document.createElement("optgroup");
            anOptgroup.setAttribute("label", group);

            const options = data.filter(function(x){
                return x.parent === group;
            });
            options.forEach(function (x) {
                let anOption = document.createElement("option");
                anOption.value = x.value;
                anOption.text = x.text;
                if(x.selected){
                    anOption.setAttribute("selected",'selected')
                }
                anOptgroup.appendChild(anOption);
            });
            self.root.appendChild(anOptgroup);
        }
    }else{
        data.forEach(function (x) {
            let anOption = document.createElement("option");
            anOption.value = x.value;
            anOption.text = x.text;
            if(x.selected){
                anOption.setAttribute("selected",true)
            }
            self.root.appendChild(anOption);
        });
    }
}

VanillaJsMultiSelectBox.prototype.remoteSearchIntegrate = function (data) {
    let self = this;

    if (data == null || data.length === 0) {
        let dataChecked = self.optionsCheckedToData();
        if(dataChecked)
            data = dataChecked.slice(0);
        self.remoteSearchIntegrateIt(data);
    } else {
        let dataChecked = self.optionsCheckedToData();
        if (dataChecked.length > 0){
            for (var i = data.length - 1; i >= 0; i--) {
                if(dataChecked.indexOf(data[i].id) !==-1){
                    data.slice(i,1);
                }
            }
        }
        data = data.concat(dataChecked);

        self.remoteSearchIntegrateIt(data);
    }
}

VanillaJsMultiSelectBox.prototype.optionsCheckedToData = function () {
    let self = this;
    let dataChecked = [];
    let treeOptions = self.ul.querySelectorAll("li.active:not(.grouped-option)");
    let keepParents = {};
    if (treeOptions) {
        Array.prototype.slice.call(treeOptions).forEach(function (x) {
            let oneData = {"value":x.getAttribute("data-value"),"text":x.getAttribute("data-text"),"selected":true};
            if(oneData.value !== "all"){
                if(self.isOptgroups){
                    let parentId = x.getAttribute("data-parent");
                    if(keepParents[parentId] !== undefined){
                        oneData.parent = keepParents[parentId];
                    }else{
                        let parentPtr = self.ul.querySelector("#"+parentId);
                        let parentName = parentPtr.getAttribute("data-text");
                        keepParents[parentId] = parentName;
                        oneData.parent = parentName;
                    }
                }
                dataChecked.push(oneData);
            }
        });
    }
    return dataChecked;
}

VanillaJsMultiSelectBox.prototype.removeOptionsNotChecked = function (data) {
    let self = this;
    let minimumSize = self.onInitSize;
    let newSearchSize = data == null ? 0 : data.length;
    let presentSize = self.root.length;
    if (presentSize + newSearchSize > minimumSize) {
        let maxToRemove = presentSize + newSearchSize - minimumSize - 1;
        let removed = 0;
        for (var i = self.root.length - 1; i >= 0; i--) {
            if (self.root.options[i].selected === false) {
                if (removed <= maxToRemove) {
                    removed++;
                    self.root.remove(i);
                }
            }
        }
    }
}

VanillaJsMultiSelectBox.prototype.changeTree = function (data, options) {
    let self = this;
    self.empty();
    self.remoteSearchIntegrateIt(data);
    if (options && options.onSearch) {
        if (typeof options.onSearch === 'function') {
            self.onSearch = options.onSearch;
            self.isSearchRemote = true;
        }
    }
    self.listElements = this.drop.querySelectorAll("li:not(.grouped-option)");
}

VanillaJsMultiSelectBox.prototype.remoteSearchIntegrateIt = function (data) {
    let self = this;
    if (data == null || data.length === 0) return;
    while(self.root.firstChild)
        self.root.removeChild(self.root.firstChild);

    self.buildSelect(data);
    self.reloadTree();
}

VanillaJsMultiSelectBox.prototype.reloadTree = function () {
    let self = this;
    let lis = self.ul.querySelectorAll("li");
    if (lis != null) {
        for (var i = lis.length - 1; i >= 0; i--) {
            if (lis[i].getAttribute('data-value') !== 'all') {
                self.ul.removeChild(lis[i]);
            }
        }
    }

    let selectedTexts = ""
    let sep = "";
    let nrActives = 0;
    if (self.isOptgroups) {
        if (this.root.getElementsByTagName('optgroup') !== null) {
            self.options = this.root.options;
            let groups = this.root.getElementsByTagName('optgroup');
            Array.prototype.slice.call(groups).forEach(function (group) {
                let groupOptions = group.querySelectorAll('option');
                let li = document.createElement("li");
                let span = document.createElement("span");
                let iCheck = document.createElement("i");
                let labelElement = document.createElement("b");
                let dataWay = group.getAttribute("data-way");
                if (!dataWay) dataWay = "closed";
                if (!dataWay || (dataWay !== "closed" && dataWay !== "open")) dataWay = "closed";
                li.appendChild(span);
                li.appendChild(iCheck);
                self.ul.appendChild(li);
                li.classList.add('grouped-option');
                li.classList.add(dataWay);
                self.currentOptgroup++;
                let optId = self.rootToken + "-opt-" + self.currentOptgroup;
                li.id = optId;
                li.appendChild(labelElement);
                labelElement.appendChild(document.createTextNode(group.label));
                li.setAttribute("data-text", group.label);
                self.ul.appendChild(li);

                Array.prototype.slice.call(groupOptions).forEach(function (x) {
                    let text = x.textContent;
                    let value = x.value;
                    let classes = x.getAttribute("class");
                    if (classes) {
                        classes = classes.split(" ");
                    }
                    else {
                        classes = [];
                    }
                    classes.push(dataWay);
                    let li = document.createElement("li");
                    let isSelected = x.hasAttribute("selected");
                    self.ul.appendChild(li);
                    li.setAttribute("data-value", value);
                    li.setAttribute("data-text", text);
                    li.setAttribute("data-parent", optId);
                    if (classes.length !== 0) {
                        classes.forEach(function (x) {
                            li.classList.add(x);
                        });
                    }
                    if (isSelected) {
                        nrActives++;
                        selectedTexts += sep + text;
                        sep = ",";
                        li.classList.add("active");
                        if (!self.isMultiple) {
                            self.title.textContent = text;
                            if (classes.length !== 0) {
                                classes.forEach(function (x) {
                                    self.title.classList.add(x);
                                });
                            }
                        }
                    }
                    li.appendChild(document.createTextNode(text));
                })
            })
        }
        self.listElements = this.drop.querySelectorAll("li:not(.grouped-option)");
    } else {
        self.options = self.root.querySelectorAll("option");
        Array.prototype.slice.call(self.options).forEach(function (x) {
            let text = x.textContent;
            let value = x.value;
            if (value !== "all") {
                let originalAttrs;
                if (x.hasAttributes()) {
                    originalAttrs = Array.prototype.slice.call(x.attributes)
                        .filter(function (a) {
                            return self.forbidenAttributes.indexOf(a.name) === -1
                        });
                }
                let classes = x.getAttribute("class");
                if (classes) {
                    classes = classes
                        .split(" ")
                        .filter(function (c) {
                            return self.forbidenClasses.indexOf(c) === -1
                        });
                } else {
                    classes = [];
                }
                let li = document.createElement("li");
                let isSelected = x.hasAttribute("selected");

                let isDisabled = x.disabled;

                self.ul.appendChild(li);
                li.setAttribute("data-value", value);
                li.setAttribute("data-text", text);

                if (originalAttrs !== undefined) {
                    originalAttrs.forEach(function (a) {
                        li.setAttribute(a.name, a.value);
                    });
                }

                classes.forEach(function (x) {
                    li.classList.add(x);
                });

                if (self.maxOptionWidth < Infinity) {
                    li.classList.add("short");
                    li.style.maxWidth = self.maxOptionWidth + "px";
                }

                if (isSelected) {
                    nrActives++;
                    selectedTexts += sep + text;
                    sep = ",";
                    li.classList.add("active");
                    if (!self.isMultiple) {
                        self.title.textContent = text;
                        if (classes.length !== 0) {
                            classes.forEach(function (x) {
                                self.title.classList.add(x);
                            });
                        }
                    }
                }
                if (isDisabled) {
                    li.classList.add("disabled");
                }
                li.appendChild(document.createTextNode(" " + text));
            }
        });
    }

}

VanillaJsMultiSelectBox.prototype.disableItems = function (values) {
    let self = this;
    let foundValues = [];
    if (VanillaJsMultiSelectBox_type(values) === "string") {
        values = values.split(",");
    }

    if (VanillaJsMultiSelectBox_type(values) === "array") {
        Array.prototype.slice.call(self.options).forEach(function (x) {
            if (values.indexOf(x.value) !== -1) {
                foundValues.push(x.value);
                x.setAttribute("disabled", "");
            }
        });
    }
    Array.prototype.slice.call(self.listElements).forEach(function (x) {
        let val = x.getAttribute("data-value");
        if (foundValues.indexOf(val) !== -1) {
            x.classList.add("disabled");
        }
    });
}

VanillaJsMultiSelectBox.prototype.enableItems = function (values) {
    let self = this;
    let foundValues = [];
    if (VanillaJsMultiSelectBox_type(values) === "string") {
        values = values.split(",");
    }

    if (VanillaJsMultiSelectBox_type(values) === "array") {
        Array.prototype.slice.call(self.options).forEach(function (x) {
            if (values.indexOf(x.value) != -1) {
                foundValues.push(x.value);
                x.removeAttribute("disabled");
            }
        });
    }

    Array.prototype.slice.call(self.listElements).forEach(function (x) {
        if (foundValues.indexOf(x.getAttribute("data-value")) !== -1) {
            x.classList.remove("disabled");
        }
    });
}

VanillaJsMultiSelectBox.prototype.checkSelectMax = function (nrActives) {
    let self = this;
    if (self.maxSelect === Infinity || !self.isMultiple) return;
    if (self.maxSelect <= nrActives) {
        Array.prototype.slice.call(self.listElements).forEach(function (x) {
            if (x.hasAttribute('data-value')) {
                if (!x.classList.contains('disabled') && !x.classList.contains('active')) {
                    x.classList.add("overflow");
                }
            }
        });
    } else {
        Array.prototype.slice.call(self.listElements).forEach(function (x) {
            if (x.classList.contains('overflow')) {
                x.classList.remove("overflow");
            }
        });
    }
}

VanillaJsMultiSelectBox.prototype.checkUncheckFromChild = function (liClicked) {
    let self = this;
    let parentId = liClicked.getAttribute('data-parent');
    let parentLi = document.getElementById(parentId);
    if (!self.isMultiple) return;
    let listElements = self.drop.querySelectorAll("li");
    let childrenElements = Array.prototype.slice.call(listElements).filter(function (el) {
        return el.hasAttribute("data-parent") && el.getAttribute('data-parent') === parentId  && !el.classList.contains('hidden-search') ;
    });
    let nrChecked = 0;
    let nrCheckable = childrenElements.length;
    if (nrCheckable === 0) return;
    childrenElements.forEach(function (el) {
        if (el.classList.contains('active')) nrChecked++;
    });
    if (nrChecked === nrCheckable || nrChecked === 0) {
        if (nrChecked === 0) {
            parentLi.classList.remove("checked");
        } else {
            parentLi.classList.add("checked");
        }
    } else {
        parentLi.classList.remove("checked");
    }
}

VanillaJsMultiSelectBox.prototype.checkUncheckFromParent = function (liClicked) {
    let self = this;
    let parentId = liClicked.id;
    if (!self.isMultiple) return;
    let listElements = self.drop.querySelectorAll("li");
    let childrenElements = Array.prototype.slice.call(listElements).filter(function (el) {
        return el.hasAttribute("data-parent") && el.getAttribute('data-parent') === parentId && !el.classList.contains('hidden-search');
    });
    let nrChecked = 0;
    let nrCheckable = childrenElements.length;
    if (nrCheckable === 0) return;
    childrenElements.forEach(function (el) {
        if (el.classList.contains('active')) nrChecked++;
    });
    if (nrChecked === nrCheckable || nrChecked === 0) {
        //check all or uncheckAll : just do the opposite
        childrenElements.forEach(function (el) {
            const event = new CustomEvent('click', { bubbles: true, cancelable: false });
            el.dispatchEvent(event);
        });
        if (nrChecked === 0) {
            liClicked.classList.add("checked");
        } else {
            liClicked.classList.remove("checked");
        }
    } else {
        //check all
        liClicked.classList.remove("checked");
        childrenElements.forEach(function (el) {
            if (!el.classList.contains('active')) {
                const event = new CustomEvent('click', { bubbles: true, cancelable: false });
                el.dispatchEvent(event);
            }
        });
    }
}

VanillaJsMultiSelectBox.prototype.checkUncheckAll = function () {
    let self = this;
    if (!self.isMultiple) return;
    let nrChecked = 0;
    let nrCheckable = 0;
    let checkAllElement = null;
    if (self.listElements == null) return;
    Array.prototype.slice.call(self.listElements).forEach(function (x) {
        if (x.hasAttribute('data-value')) {
            if (x.getAttribute('data-value') === 'all') {
                checkAllElement = x;
            }
            if (x.getAttribute('data-value') !== 'all'
                && !x.classList.contains('hidden-search')
                && !x.classList.contains('disabled')) {
                nrCheckable++;
                nrChecked += x.classList.contains('active');
            }
        }
    });

    if (checkAllElement) {
        if (nrChecked === nrCheckable && self.userOptions.disableAllMessage === false) {
            // check the checkAll checkbox
            let selectedTexts = self.userOptions.translations.all || "all";
            if (self.userOptions.placeHolder !== ""){
                self.title.textContent = self.userOptions.placeHolder + ": "+selectedTexts;
            } else {
                self.title.textContent = selectedTexts;
            }
            checkAllElement.classList.add("active");
            checkAllElement.innerText = self.userOptions.translations.clearAll;
            checkAllElement.setAttribute('data-selected', 'true')
        } else if (nrChecked === 0) {
            // uncheck the checkAll checkbox
            let selectedTexts = self.userOptions.placeHolder || "-";
            if (self.userOptions.placeHolder !== ""){
                let selectedTexts = "-";
                self.title.textContent = self.userOptions.placeHolder + ": "+selectedTexts;
            } else {
                self.title.textContent = selectedTexts;
            }
            checkAllElement.classList.remove("active");
            checkAllElement.innerText = self.userOptions.translations.selectAll;
            checkAllElement.setAttribute('data-selected', 'false')
        }
    }
}

VanillaJsMultiSelectBox.prototype.setValue = function (values) {
    let self = this;
    let listElements = self.drop.querySelectorAll("li");

    if (values === null || values === undefined || values === "") {
        self.empty();
    } else {
        if (self.isMultiple) {
            if (VanillaJsMultiSelectBox_type(values) === "string") {
                if (values === "all") {
                    values = [];
                    Array.prototype.slice.call(listElements).forEach(function (x) {
                        if (x.hasAttribute('data-value')) {
                            let value = x.getAttribute('data-value');
                            if (value !== 'all') {
                                if (!x.classList.contains('hidden-search') && !x.classList.contains('disabled')) {
                                    values.push(x.getAttribute('data-value'));
                                }
                                // already checked (but hidden by search)
                                if (x.classList.contains('active')) {
                                    if (x.classList.contains('hidden-search') || x.classList.contains('disabled')) {
                                        values.push(value);
                                    }
                                }
                            }else{
                                x.classList.add("active");
                            }
                        } else if (x.classList.contains('grouped-option')) {
                            x.classList.add("checked");
                        }
                    });
                } else if (values === "none") {
                    values = [];
                    Array.prototype.slice.call(listElements).forEach(function (x) {
                        if (x.hasAttribute('data-value')) {
                            let value = x.getAttribute('data-value');
                            if (value !== 'all') {
                                if (x.classList.contains('active')) {
                                    if (x.classList.contains('hidden-search') || x.classList.contains('disabled')) {
                                        values.push(value);
                                    }
                                }
                            }
                        } else if (x.classList.contains('grouped-option')) {
                            x.classList.remove("checked");
                        }
                    });
                } else {
                    values = values.split(",");
                }
            }
            let foundValues = [];
            if (VanillaJsMultiSelectBox_type(values) === "array") {
                Array.prototype.slice.call(self.options).forEach(function (x) {
                    if (values.indexOf(x.value) !== -1) {
                        x.selected = true;
                        foundValues.push(x.value);
                    } else {
                        x.selected = false;
                    }
                });
                let selectedTexts = ""
                let sep = "";
                let nrActives = 0;
                let nrAll = 0;
                Array.prototype.slice.call(listElements).forEach(function (x) {
                    if (x.value !== 'all') {
                        nrAll++;
                    }
                    if (foundValues.indexOf(x.getAttribute("data-value")) !== -1) {
                        x.classList.add("active");
                        nrActives++;
                        selectedTexts += sep + x.getAttribute("data-text");
                        sep = ",";
                    } else {
                        x.classList.remove("active");
                    }
                });
                if (nrAll === nrActives - Number(!self.userOptions.disableSelectAll) && self.userOptions.disableAllMessage === false) {
                    selectedTexts = self.userOptions.translations.all || "all";
                } else if (self.multipleSize !== -1) {
                    if (nrActives > self.multipleSize) {
                        let wordForItems = self.userOptions.translations.items || "items"
                        selectedTexts = nrActives + " " + wordForItems;
                    }
                }
                if (self.userOptions.placeHolder !== ""){
                    self.title.textContent = self.userOptions.placeHolder + ": "+selectedTexts;
                } else {
                    self.title.textContent = selectedTexts;
                }
                self.privateSendChange();
            }
            self.checkUncheckAll();
        } else {
            let found = false;
            let text = "";
            let classNames = ""
            Array.prototype.slice.call(listElements).forEach(function (x) {
                let liVal = x.getAttribute("data-value") === values;
                if(liVal !== "all"){
                    if (liVal === values) {
                        x.classList.add("active");
                        found = true;
                        text = x.getAttribute("data-text")
                    } else {
                        x.classList.remove("active");
                    }
                }
            });
            Array.prototype.slice.call(self.options).forEach(function (x) {
                if (x.value === values) {
                    x.selected = true;
                    className = x.getAttribute("class");
                    if (!className) className = "";
                } else {
                    x.selected = false;
                }
            });
            if (found) {
                self.title.textContent = text;
                if (self.userOptions.placeHolder !== "" && self.title.textContent === "") {
                    self.title.textContent = self.userOptions.placeHolder;
                }
                if (className !== "") {
                    self.title.setAttribute("class", className + " title");
                } else {
                    self.title.setAttribute("class", "title");
                }
            }
        }
    }
}

VanillaJsMultiSelectBox.prototype.privateSendChange = function () {
    const event = new CustomEvent('change', { bubbles: true, cancelable: false });
    this.root.dispatchEvent(event);
}

VanillaJsMultiSelectBox.prototype.empty = function () {
    Array.prototype.slice.call(this.listElements).forEach(function (x) {
        x.classList.remove("active");
    });
    let parentElements = this.drop.querySelectorAll("li.grouped-option");
    if(parentElements){
        Array.prototype.slice.call(parentElements).forEach(function (x) {
            x.classList.remove("checked");
        });
    }
    Array.prototype.slice.call(this.options).forEach(function (x) {
        x.selected = false;
    });
    this.title.textContent = "";
    if (this.userOptions.placeHolder !== "" && this.title.textContent === "") {
        this.title.textContent = this.userOptions.placeHolder;
    }
    this.checkUncheckAll();
    this.privateSendChange();
}

VanillaJsMultiSelectBox.prototype.destroy = function () {
    let already = document.getElementById("btn-group-" + this.rootToken);
    if (already) {
        VSBoxCounter.remove(this.instanceOffset);
        already.remove();
        this.root.style.display = "inline-block";
    }
}
VanillaJsMultiSelectBox.prototype.disable = function () {
    let already = document.getElementById("btn-group-" + this.rootToken);
    if (already) {
        let button;
        button = already.querySelector("button")
        if (button) button.classList.add("disabled");
        this.isDisabled = true;
    }
}
VanillaJsMultiSelectBox.prototype.enable = function () {
    let already = document.getElementById("btn-group-" + this.rootToken);
    if (already) {
        let button;
        button = already.querySelector("button")
        if (button) button.classList.remove("disabled");
        this.isDisabled = false;
    }
}

// Polyfills for IE
if (!('remove' in Element.prototype)) {
    Element.prototype.remove = function () {
        if (this.parentNode) {
            this.parentNode.removeChild(this);
        }
    };
}

export function VanillaJsMultiSelectBox_type(target) {
    const computedType = Object.prototype.toString.call(target);
    const stripped = computedType.replace("[object ", "").replace("]", "");
    return stripped.toLowerCase();
}

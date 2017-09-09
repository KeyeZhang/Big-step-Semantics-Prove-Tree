/*****************************
 * prooftreeDraw.js
 * v1.1: Added support for serializing/deserializing
 * v1.0: Initial
 *
 * Written by Terence Nip
 ****************************/

/***************************
 * Constructor for our drawing tool.
 ***************************/
function ProofTreeDraw(type) {
    // Set up base config with labels and things
    this.config = {};
    this.config['default'] = {
        'labels': ["Default", "Ident", "Num", "Bool", "Arith", "Skip", "Assign", "Seq", "If", "While", "Rel"],
        'symbols': []
    };
    this.config['bigStep'] = {
        'labels': ["Int", "Var", "Bool", "BinOp", "Skip", "Asgn", "Seq", "If", "While", "RelOp"],
        'symbols': ['Downarrow']
    };
    this.config['smallStep'] = {
        'labels': ["Skip", "Asgn", "Seq", "If", "While"],
        'symbols': ['longrightarrow']
    };
    this.config['hoareLogic'] = {
        'labels': ["Skip", "Asgn", "Comp", "Cond", "Loop", "Conseq"],
        'symbols': ['hspace{1em}', 'hspace{1em}']
    };
    this.config['monoTy'] = {
        'labels': ["Const", "Var", "Arith", "Bool", "If", "App", "Let", "LetRec"],
        'symbols': ['vdash', 'colon']
    };
    
    this.problemType = type;
    if(!(this.problemType in this.config)) {
        this.problemType = 'default';
        console.log('This problem type is invalid.');
    }
    
    this.initCount = 0;
};

ProofTreeDraw.prototype.initialize = function() {
    if (this.initCount > 0) {
        return;
    } else {
        
        // Create the list of symbols we use and the labels we want per question type.
        this.symbols = this.config[this.problemType]['symbols'];
        this.labels = this.config[this.problemType]['labels'];
        this.labelDropdown = this.labels.map(function(v) {
                                             return '<option name="' + v.toLowerCase() + '">' + v + '</option>';
                                             });
        
        this.setupMode();
        this.loadOperator();
        
        // Initialize the given dropdown with this.labelDropdown.
        $('.proofTreeDropdownLabel').append(this.labelDropdown);
        
        this.initCount++;
        this.setEventListeners();
        this.unmarshal();
    }
};

ProofTreeDraw.prototype.setupMode = function() {
    // Set up the look and feel in accordance with the mode we're in.
    if(this.problemType == 'bigStep' ||
       this.problemType == 'smallStep') {
        $('.conditionText').css('display', 'none');
        $('#proofTreeModalCondition').css('display', 'none');
        $('#proofTreeModalAnsCondition').css('display', 'none');
        $('.proofTreeLineCondition').css('display', 'none');
        $('.proofTreeLineConditionPhrase').css('display', 'none');
    }
}

ProofTreeDraw.prototype.loadOperator = function() {
    // If it's the case that we're in Big Step/Small Step
    if(this.symbols.length == 1) {
        $('.operator').html(' $\\' + this.symbols[0] + '$ ');
    } else if (this.symbols.length == 2) {
        $('.operator').html(' $\\' + this.symbols[0] + '$ ');
        $('.proofTreeLineConditionPhrase').html(' $\\' + this.symbols[1] + '$ ');
        $('.conditionText').html(' $\\' + this.symbols[1] + '$ ');
    }
    
    MathJax.Hub.Queue(["Typeset",MathJax.Hub]);
};

/***************************
 * This is a wrapper for hiding our modal.
 ***************************/
ProofTreeDraw.prototype.hideModal = function() {
    $('#proofTreeModalContainer').css('display', 'none');
}

/***************************
 * This is a wrapper for showing our modal.
 ***************************/
ProofTreeDraw.prototype.showModal = function(mode) {
    $('#proofTreeModalContainer').css('display', '');
    $('#proofTreeModal').css('display', '');
    $('.proofTreeForm').css('display', 'block');
    
    if (mode == 'add') {
        $('#proofTreeButtonSave').css('display', '');
        $('#proofTreeButtonEdit').css('display', 'none');
    } else if (mode == 'edit') {
        $('#proofTreeButtonSave').css('display', 'none');
        $('#proofTreeButtonEdit').css('display', '');
    }
}

/***************************
 * serializeTree
 * Serializes the tree for submission.
 ***************************/
ProofTreeDraw.prototype.serializeTree = function() {
    var result = {};
    
    $('#proofTreeContainer .proofTreeNest').each(function() {
                                                 var treeLocation = $(this).attr('id');
                                                 var lineLeft = $('#' + treeLocation +  ' > .proofTreeLine > .proofTreeLineLeft').clone().children().remove().end().text();
                                                 var lineRight = $('#' + treeLocation + ' > .proofTreeLine >  .proofTreeLineRight').clone().children().remove().end().text();
                                                 var lineCondition = $('#' + treeLocation + ' > .proofTreeLine > .proofTreeLineCondition').clone().children().remove().end().text();
                                                 var lineLabel = $('#' + treeLocation + ' > .proofTreeLabel >  .proofTreeDropdownLabel').val();
                                                 var lineSideCondition = $('#' + treeLocation + ' > .proofTreeSideCondition').val();
                                                 
                                                 console.log(lineCondition);
                                                 console.log($('#' + treeLocation + ' .proofTreeLine > .proofTreeLineCondition').clone().children().remove().end().text())
                                                 
                                                 result[treeLocation] = {};
                                                 result[treeLocation]['left'] = $.trim(lineLeft);
                                                 result[treeLocation]['middle'] = $.trim(lineRight);
                                                 result[treeLocation]['right'] = $.trim(lineCondition);
                                                 result[treeLocation]['label'] = $.trim(lineLabel);
                                                 result[treeLocation]['sideCondition'] = $.trim(lineSideCondition);
                                                 });
    
    var keypress = jQuery.Event('input');
    $('#serializedTree').val(JSON.stringify(result));
    console.log(JSON.stringify(result));
    $('#serializedTree').click().trigger(keypress).blur();
    
    
    console.log(result);
    
    return result;
}

/***************************
 * giveWidths
 * Assigns widths to each node in our proof tree.
 ***************************/
ProofTreeDraw.prototype.giveWidths = function(elems, hierarchy, currLevel) {
    var relevantElems = [];
    
    // An element is relevant if they have the same level ID.
    for (var i = 0; i < elems.length; i++) {
        if (elems[i].classList.contains('proofTreeNest')) {
            relevantElems.push(elems[i]);
        }
    }
    
    // elemCount is used for giving each "node" in our tree a unique ID.
    var elemCount = 0;
    var width = $('#proofTreeContainer').width();
    
    // For every level, style the elements accordingly.
    for (var i = 0; i < relevantElems.length; i++) {
        var currChar = String.fromCharCode(97 + elemCount);
        elems[i].id = hierarchy + '-l' + currLevel + currChar;
        
        if (elems[i].id == 'root-l0a') {
            width = $('#proofTreeContainer').width();
        } else {
            width = (Math.floor($(elems[0]).parent('.proofTreeNest').width() - 25) /
                     relevantElems.length);
        }
        
        // Give the checkbox this ID!
        $(elems[i]).children('.proofTreeLabel')
        .children('input[type=checkbox]')
        .attr('data-checkedoptional', 'submittedAnswer.' + elems[i].id);
        
        var elem = $('#' + elems[i].id);
        elem.outerWidth(width + 'px');
        elem.css('display', 'table-cell');
        elem.css('vertical-align', 'bottom');
        elem.css('padding-left', '3px');
        elem.css('padding-right', '3px');
        if (elems[i].classList.contains('proofTreeNest')) {
            elem = elem.children('.proofTreeNest:last-child');
            elem.outerWidth(width + 'px');
            elem.css('margin', '0');
            elem.css('text-align', 'center');
            elem.css('display', 'table-cell');
            elem.css('vertical-align', 'bottom');
        }
        
        elemCount++;
        
        if ($(elems[i]).children('.proofTreeNest').length > 0) {
            this.giveWidths($(elems[i]).children('.proofTreeNest'), elems[i].id, currLevel + 1);
        }
    }
    
    // Every time we resize, we need to reserialize.
    console.log('resize');
    this.serializeTree();
}

ProofTreeDraw.prototype.unmarshal = function() {
    var rawString = $('#serializedTree').val();
    var jsonTree = JSON.parse(rawString);
    var treePositions = Object.keys(jsonTree).sort();
    
    for (var i = 0; i < treePositions.length; i++) {
        var currentPosition = treePositions[i];
        var parentPosition = treePositions[i].split('-');
        parentPosition.pop();
        parentPosition = parentPosition.join('-');
        
        var currentPositionId = '#' + currentPosition;
        var parentPositionId = '#' + parentPosition;
        
        var labelVal = jsonTree[currentPosition]['label'];
        var leftVal = jsonTree[currentPosition]['left'];
        var middleVal = jsonTree[currentPosition]['middle'];
        var rightVal = jsonTree[currentPosition]['right'];
        var sideConditionVal = jsonTree[currentPosition]['sideCondition'];
        
        // We handle root-l0a separately from everything else.
        // More specifically, we only update the dropdown.
        if (parentPosition != "root" && $(currentPosition).length == 0) {
            // We need to get the current level in the tree - and as such, we need that
            // of the parent.
            console.log(parentPositionId, $(parentPositionId).attr('class'));
            var parentLevel = $(parentPositionId).attr('class').split(' ');
            parentLevel.shift();
            parentLevel = parentLevel[0].split('l');
            parentLevel.shift();
            var currLevel = parseInt(parentLevel[0]) + 1;
            var currLevelText = "l" + currLevel;
            console.log(currLevel);
            
            var conditionClause = (sideConditionVal == '') ? "where " : "";
            var style = '';
            var operator = '<span class="operator"></span>';
            
            var nestHtml = '<div class="proofTreeNest ' + currLevelText + '">' +
            '<div class="proofTreeAddSubproof">' +
            '<a href="#" currLevel="' + currLevel + '" class="addSubproof">[+]</a>' +
            '<span class="proofTreeSideConditionLink">' +
            ' | <a href="#" class="addSideCondition">[sc]</a>' +
            '</span>' +
            '</div>' +
            '<div class="proofTreeActions">' +
            '<a href="#" currLevel="' + currLevel + '" class="edit">[e]</a> | ' +
            '<a href="#" class="delete">[x]</a>' +
            '</div>' +
            '<input type="text" class="proofTreeSideCondition" placeholder="Side Condition" />' +
            '<div class="proofTreeLabel">' +
            '<select class="proofTreeDropdownLabel">' +
            '<option selected></option>' +
            this.labelDropdown +
            '</select>' +
            '</div>' +
            '<div class="proofTreeLine" ' + style + '>' +
            '<span class="proofTreeLineLeft tt">' +
            $('<div />').text(leftVal).html() +
            '</span>' +
            operator +
            '<span class="proofTreeLineRight tt">' +
            $('<div />').text(middleVal).html() +
            '</span>' +
            '<span class="proofTreeLineConditionPhrase">' +
            conditionClause +
            '</span>' +
            '<span class="proofTreeLineCondition tt">' +
            $('<div />').text(rightVal).html() +
            '</span>' +
            '</div>' +
            '</div>';
            
            // Add the new subtree into the proof tree
            $(parentPositionId).children('.proofTreeAddSubproof').before(nestHtml);
            
            // Do the resizing and add the corresponding operator, rerun MathJax
            this.giveWidths($('#proofTreeContainer').children(), 'root', 0);
            this.setupMode();
            this.loadOperator();
            
        } // close conditional for root
        
        $(currentPositionId + ' > .proofTreeLabel > select').val(labelVal);
        $(currentPositionId + ' > .proofTreeSideCondition').val(sideConditionVal);
        if (sideConditionVal != '') {
            $(currentPositionId + ' > .proofTreeSideCondition').css('display', 'inline');
        }
        console.log("label", labelVal);
    }
}

ProofTreeDraw.prototype.setEventListeners = function() {
    var that = this;
    /***************************
     * Event Listener: proofTreeButtonSave
     * Creates a new node in our proof tree and resizes.
     ***************************/
    $('#proofTreeButtonSave').on('click', function(e) {
                                 window.console.log('click');
                                 that.hideModal();
                                 var parentId = $(this).attr('parentId');
                                 var nextLevel = $(this).attr('nextLevel');
                                 var currLevel = nextLevel - 1;
                                 var nextLevelText = "l" + nextLevel;
                                 
                                 var conditionClause = ($('#proofTreeButtonAddSideCond').css('display') == 'none' && $('#proofTreeModalAnsCondition').val().length > 0) ? "where " : "";
                                 var style = '';
                                 var operator = '<span class="operator"></span>';
                                 
                                 window.console.log('left', $('#proofTreeModalAnsLeft').val());
                                 
                                 var nestHtml = '<div class="proofTreeNest ' + nextLevelText + '">' +
                                 '<div class="proofTreeAddSubproof">' +
                                 '<a href="#" currLevel="' + nextLevel + '" class="addSubproof">[+]</a>' +
                                 '<span class="proofTreeSideConditionLink">' +
                                 ' | <a href="#" class="addSideCondition">[sc]</a>' +
                                 '</span>' +
                                 '</div>' +
                                 '<div class="proofTreeActions">' +
                                 '<a href="#" currLevel="' + currLevel + '" class="edit">[e]</a> | ' +
                                 '<a href="#" class="delete">[x]</a>' +
                                 '</div>' +
                                 '<input type="text" class="proofTreeSideCondition" placeholder="Side Condition" />' +
                                 '<div class="proofTreeLabel">' +
                                 '<select class="proofTreeDropdownLabel">' +
                                 '<option selected></option>' +
                                 that.labelDropdown +
                                 '</select>' +
                                 '</div>' +
                                 '<div class="proofTreeLine" ' + style + '>' +
                                 '<span class="proofTreeLineLeft tt">' +
                                 $('<div/>').text($('#proofTreeModalAnsLeft').val()).html() +
                                 '</span>' +
                                 operator +
                                 '<span class="proofTreeLineRight tt">' +
                                 $('<div/>').text($('#proofTreeModalAnsRight').val()).html() +
                                 '</span>' +
                                 '<span class="proofTreeLineConditionPhrase">' +
                                 conditionClause +
                                 '</span>' +
                                 '<span class="proofTreeLineCondition tt">' +
                                 //(($('#proofTreeButtonAddSideCond').css('display') == 'none') ? $('#proofTreeModalAnsCondition').val() : '')  +
                                 $('<div/>').text($('#proofTreeModalAnsCondition').val()).html() +
                                 '</span>' +
                                 '</div>' +
                                 '</div>';
                                 
                                 // Add the new subtree into the proof tree
                                 $('#' + parentId).children('.proofTreeAddSubproof').before(nestHtml);
                                 
                                 // Do the resizing and add the corresponding operator, rerun MathJax
                                 that.giveWidths($('#proofTreeContainer').children(), 'root', 0);
                                 that.loadOperator();
                                 
                                 // Kill normal event-age
                                 e.stopImmediatePropagation()
                                 e.preventDefault()
                                 });
    
    /***************************
     * Event Listener: proofTreeButtonCancel
     * Closes the add proof tree modal.
     ***************************/
    $('#proofTreeButtonCancel').on('click', function(e) {
                                   that.hideModal();
                                   e.stopImmediatePropagation();
                                   e.preventDefault();
                                   });
    
    /***************************
     * Event Listener: a.edit
     * Opens the add proof tree modal with pre-filled values.
     ***************************/
    $(document).on('click', 'a.edit', function(e) {
                   that.showModal('edit');
                   var currLevel = parseInt($(this).attr('currLevel'));
                   var nextLevel = currLevel + 1;
                   var nextLevelText = "l" + nextLevel;
                   var currentId = $(this).parent().parent().attr('id');
                   var parentId = $(this).parent().parent().parent().attr('id');
                   
                   var proofTreeLineLeft = $(this)
                   .parent().parent()
                   .children('.proofTreeLine').children('.proofTreeLineLeft').text();
                   var proofTreeLineRight = $(this)
                   .parent().parent()
                   .children('.proofTreeLine').children('.proofTreeLineRight').text();
                   var proofTreeLineCondition = $(this)
                   .parent().parent()
                   .children('.proofTreeLine').children('.proofTreeLineCondition').text();
                   
                   var previousProofTreeLineLeft = $('#' + parentId)
                   .children('.proofTreeLine')
                   .children('.proofTreeLineLeft').text();
                   var previousProofTreeLineRight = $('#' + parentId)
                   .children('.proofTreeLine')
                   .children('.proofTreeLineRight').text();
                   var previousProofTreeLineCondition = $('#' + parentId)
                   .children('.proofTreeLine')
                   .children('.proofTreeLineCondition').text();
                   
                   // Set values in the modal for usage
                   $('#proofTreeModalAnsLeft').val(proofTreeLineLeft)
                   $('#proofTreeModalAnsRight').val(proofTreeLineRight);
                   $('#proofTreeModalAnsCondition').val(proofTreeLineCondition);
                   
                   $('#proofTreeModalLeft').text(previousProofTreeLineLeft);
                   $('#proofTreeModalRight').text(previousProofTreeLineRight);
                   $('#proofTreeModalCondition').text(previousProofTreeLineCondition);
                   
                   $('#proofTreeButtonEdit').attr('nextLevel', nextLevel);
                   $('#proofTreeButtonEdit').attr('parentId', parentId);
                   $('#proofTreeButtonEdit').attr('currentId', currentId);
                   $('#proofTreeModalContainer').css('display', 'block');
                   
                   e.stopImmediatePropagation()
                   e.preventDefault()
                   });
    
    /***************************
     * Event Listener: proofTreeButtonEdit
     * Updates the proof tree with the values in the modal.
     ***************************/
    $('#proofTreeButtonEdit').on('click', function(e) {
                                 that.hideModal();
                                 var parentId = $(this).attr('parentId');
                                 var currentId = $(this).attr('currentId');
                                 var nextLevel = $(this).attr('nextLevel');
                                 var currLevel = nextLevel - 1;
                                 var nextLevelText = "l" + nextLevel;
                                 
                                 // By default, always change both L and R
                                 window.console.log('fdsfds', $('#proofTreeModalAnsLeft').text());
                                 $('#' + currentId).children('.proofTreeLine').children('.proofTreeLineLeft')
                                 .text($('#proofTreeModalAnsLeft').val());
                                 $('#' + currentId).children('.proofTreeLine').children('.proofTreeLineRight')
                                 .text($('#proofTreeModalAnsRight').val());
                                 
                                 // Change the condition clause to blank by default
                                 var conditionClause = '';
                                 
                                 // Only change the condition & its clause if the button is invisible.
                                 $('#' + currentId).children('.proofTreeLine').children('.proofTreeLineCondition').text($('#proofTreeModalAnsCondition').val())
                                 //conditionClause = ($('#proofTreeModalAnsCondition').val().length > 0) ? "where " : "";
                                 
                                 // Assign the condition clause
                                 $('#' + currentId + ' .proofTreeLineConditionPhrase').text(conditionClause);
                                 
                                 // Do the resizing and add the corresponding operator, rerun MathJax
                                 that.giveWidths($('#proofTreeContainer').children(), 'root', 0);
                                 that.loadOperator();
                                 
                                 // Kill normal event-age
                                 e.stopImmediatePropagation()
                                 e.preventDefault()
                                 });
    
    /***************************
     * Event Listener: a.addSubproof
     * Fires up the add subproof modal with prefilled values as the bottom of
     * the rule.
     ***************************/
    $(document).on('click', 'a.addSubproof', function(e) {
                   e.stopImmediatePropagation();
                   e.preventDefault();
                   
                   that.showModal('add');
                   var currLevel = parseInt($(this).attr('currLevel'));
                   var nextLevel = currLevel + 1;
                   var nextLevelText = "l" + nextLevel;
                   var currentId = $(this).parent().parent().attr('id');
                   
                   var proofTreeLabelValue = $(this)
                   .parent().parent()
                   .children('.proofTreeLabel').children('select').val();
                   
                   var proofTreeLineLeft = $(this)
                   .parent().parent()
                   .children('.proofTreeLine').children('.proofTreeLineLeft').text();
                   var proofTreeLineRight = $(this)
                   .parent().parent()
                   .children('.proofTreeLine').children('.proofTreeLineRight').text();
                   var proofTreeLineCondition = $(this)
                   .parent().parent()
                   .children('.proofTreeLine').children('.proofTreeLineCondition').text();
                   
                   // Set values in the modal for usage
                   $('#proofTreeModalAnsLeft').val('');
                   $('#proofTreeModalAnsRight').val('');
                   $('#proofTreeModalAnsCondition').val('');
                   $('#proofTreeModalLeft').text(proofTreeLineLeft);
                   $('#proofTreeModalRight').text(proofTreeLineRight);
                   
                   $('#proofTreeModalCondition').text(proofTreeLineCondition);
                   $('#proofTreeButtonSave').attr('nextLevel', nextLevel);
                   $('#proofTreeButtonSave').attr('parentId', currentId);
                   $('#proofTreeModalContainer').css('display', 'block');
                   
                   $('#proofTreeModalLabel').text(proofTreeLabelValue);
                   
                   });
    
    /***************************
     * Event Listener: a.delete
     * Deletes the inference and ALL subproofs after confirming.
     ***************************/
    $(document).on('click', 'a.delete', function(e) {
                   if (confirm("Please confirm that you wish to delete this inference AND its associated subtrees.")) {
                   $(this).parent().parent().remove()
                   that.giveWidths($('#proofTreeContainer').children(), 'root', 0);
                   console.log('delete');
                   var serializedTree = that.serializeTree();
                   }
                   e.stopImmediatePropagation()
                   e.preventDefault()
                   });
    
    /***************************
     * Event Listener: proofTreeViewModalOpen
     * Opens a modal for users to view the tree in a larger form.
     *
     * The reason why we don't allow for editing in the larger modal is
     * because we'd have to support another mode of editing - which is a
     * veritable PITA.
     ***************************/
    $('#proofTreeViewModalOpen').on('click', function(e) {
                                    $('#proofTreeModalContainer').css('display', 'block');
                                    
                                    var proofTreeView = $('.proofTreeView').css('display', 'block');
                                    $('#proofTreeViewModal').css('display', 'block').append(proofTreeView);
                                    
                                    var proofTree = $('#proofTreeContainer').detach();
                                    $('#proofTreeViewModalClose').before(proofTree);
                                    that.giveWidths($('#proofTreeContainer').children(), 'root', 0);
                                    
                                    $('.proofTreeAddSubproof').css('display', 'none');
                                    $('.proofTreeActions').css('display', 'none');
                                    $('.proofTreeDropdownLabel').attr('disabled', 'disabled');
                                    $('.proofTreeDropdownLabel').css('background-color', '#AAA');
                                    $('.proofTreeDropdownLabel').css('color', '#000');
                                    
                                    $('.proofTreeSideCondition').attr('disabled', 'disabled');
                                    $('.proofTreeSideCondition').css('background-color', '#AAA');
                                    $('.proofTreeSideCondition').css('color', '#000');
                                    
                                    $('#proofTreeModal').css('display', 'none');
                                    });
    
    /***************************
     * Event Listener: proofTreeViewModalClose
     * Closes the modal allowing users to view the tree in a larger form.
     ***************************/
    $('#proofTreeViewModalClose').on('click', function(e) {
                                     $('#proofTreeModalContainer').css('display', 'none');
                                     $('#proofTreeViewModal').css('display', 'none')
                                     
                                     var proofTree = $('#proofTreeContainer').detach();
                                     $(proofTree).insertBefore('#proofTreeViewModalOpen');
                                     that.giveWidths($('#proofTreeContainer').children(), 'root', 0);
                                     
                                     $('.proofTreeAddSubproof').css('display', 'inline');
                                     $('.proofTreeActions').css('display', 'inline');
                                     
                                     $('.proofTreeDropdownLabel').removeAttr('disabled');
                                     $('.proofTreeDropdownLabel').css('background-color', '');
                                     $('.proofTreeDropdownLabel').css('color', '');
                                     
                                     $('.proofTreeSideCondition').removeAttr('disabled');
                                     $('.proofTreeSideCondition').css('background-color', '');
                                     $('.proofTreeSideCondition').css('color', '');
                                     
                                     $('#proofTreeModal').css('display', 'enabled');
                                     });
    
    $(document).on('change', '.proofTreeDropdownLabel', function(e) {
                   console.log('changelabel');
                   var serializedTree = that.serializeTree();
                   });
    
    $(document).on('change', '.proofTreeSideCondition', function(e) {
                   console.log('sidecondition');
                   var serializedTree = that.serializeTree();
                   });
    
    // Primarily handles the modal when we resize the window.
    window.onresize = function() {
        $('#proofTreeModalContainer').height($(window).height() - $('.nav').height())
        $('#proofTreeModalContainer').css('margin-top', '-' + $('.navbar').css('margin-bottom'))
        that.giveWidths($('#proofTreeContainer').children(), 'root', 0);
    };
    
    $(document).on('keyup', 'input.proofTreeSideCondition', function(e) {
                   console.log('insert sc');
                   that.serializeTree();
                   e.stopImmediatePropagation()
                   e.preventDefault()
                   });
    
    $(document).on('click', 'a.addSideCondition', function(e) {
                   var currentPosition = $(this).parent().parent().parent().attr('id');
                   if ($('#' + currentPosition + ' > .proofTreeSideCondition').css('display') == 'none') {
                   $('#' + currentPosition + ' > .proofTreeSideCondition').css('display', 'inline');
                   } else {
                   $('#' + currentPosition + ' > .proofTreeSideCondition').css('display', 'none');
                   }
                   e.stopImmediatePropagation()
                   e.preventDefault()
                   });
    
    $(document).ready(function() {
                      // Re-runs the MathJax stuff after we dynamically insert the operator.
                      that.loadOperator();
                      
                      // This allows us to inject a modal on top of all the things.
                      if($('#proofTreeModalContainer').length == 0) {
                      $('#nav')
                      .after('<div id="proofTreeModalContainer"><div id="proofTreeViewModal" style="display:none;"></div><div id="proofTreeModal" style="display:none;"></div></div>');
                      
                      var proofTreeForm = $('.proofTreeForm').detach();
                      $('#proofTreeModal').append(proofTreeForm);
                      }
                      
                      // Handles the initial sizing of the modal.
                      $('#proofTreeModalContainer').height($(window).height() - $('.nav').height())
                      $('#proofTreeModalContainer').css('margin-top', '-' + $('.navbar').css('margin-bottom'))
                      
                      $('#content .proofTreeForm').remove();
                      
                      // Handles side condition stuff.
                      if (window.fullQuestionName !== undefined &&
                          window.fullQuestionName.indexOf('polyTy') >= 0) {
                      $('.conditionText').css('display', 'none');
                      $('#proofTreeModalAnsCondition').css('display', 'none');
                      }
                      
                      $('#proofTreeModalContainer').css('display','none');
                      });
}

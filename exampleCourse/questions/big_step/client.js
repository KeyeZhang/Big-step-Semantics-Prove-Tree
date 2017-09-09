define(["SimpleClient", "text!./question.html", "text!./answer.html", "text!clientCode/externally_graded_submission.html", "clientCode/go" ], function(SimpleClient, questionTemplate, answerTemplate, submissionTemplate, go) {

       
var client = new SimpleClient.SimpleClient({questionTemplate: questionTemplate, submissionTemplate: submissionTemplate, skipRivets: true});


client.on('renderQuestionFinished', function() {
    
        if (window.goSamples) goSamples();  // init for these samples
        var $ = go.GraphObject.make;  // for conciseness in defining templates
        
        //initialize the diagram and name it "myDiagram"
        myDiagram = $(go.Diagram, "myDiagramDiv",  // must name or refer to the DIV HTML element
                      {
                      initialContentAlignment: go.Spot.Left,
                      allowSelect: true,             // the user cannot select any part.
                      allowHorizontalScroll: false,  // disallow scrolling or panning
                      allowVerticalScroll: false,
                      allowZoom: false,
                      layout: $(go.TreeLayout),      // create a TreeLayout for the decision tree
                      "undoManager.isEnabled": true  // enable undo & redo
                      });

        // custom behavior for expanding/collapsing half of the subtree from a node
        function buttonExpandCollapse(e, port) {
            var node = port.part;
            node.diagram.startTransaction("expand/collapse");
            var portid = port.portId;
            node.findLinksOutOf(portid).each(function(l) {
                                     if (l.visible) {
                                     // collapse whole subtree recursively
                                     collapseTree(node, portid);
                                     } else {
                                     // only expands immediate children and their links
                                     l.visible = true;
                                     var n = l.getOtherNode(node);
                                     if (n !== null) {
                                     n.location = node.getDocumentPoint(go.Spot.TopRight);
                                     n.visible = true;
                                     }
                                     }
                                     });
            myDiagram.toolManager.hideToolTip();
            node.diagram.commitTransaction("expand/collapse");
        }

// recursive function for collapsing complete subtree
        function collapseTree(node, portid) {
            node.findLinksOutOf(portid).each(function(l) {
                                             l.visible = false;
                                             var n = l.getOtherNode(node);
                                             if (n !== null) {
                                             n.visible = false;
                                             collapseTree(n, null);  // null means all links, not just for a particular portId
                                             }
                                             });
        }

// get the text for the tooltip from the data on the object being hovered over
        function tooltipTextConverter(data) {
            var str = "";
            var e = myDiagram.lastInput;
            var currobj = e.targetObject;
            if (currobj !== null && (currobj.name === "ButtonA" ||
                                     (currobj.panel !== null && currobj.panel.name === "ButtonA"))) {
                str = data.aToolTip;
            } else {
                str = data.bToolTip;
            }
            return str;
        }

// define tooltips for buttons
        var tooltipTemplate =
        $(go.Adornment, "Auto",
          $(go.Shape, "Rectangle",
            { fill: "whitesmoke", stroke: "lightgray" }),
          $(go.TextBlock,
            {
            font: "8pt sans-serif",
            wrap: go.TextBlock.WrapFit,
            desiredSize: new go.Size(200, NaN),
            alignment: go.Spot.Center,
            margin: 6
            },
            new go.Binding("text", "", tooltipTextConverter))
          );

// define the Node template for non-leaf nodes
        myDiagram.nodeTemplateMap.add("decision",
                              $(go.Node, "Auto",
                                new go.Binding("text", "text").makeTwoWay(),
                                // define the node's outer shape, which will surround the Horizontal Panel
                                $(go.Shape, "Rectangle",
                                  { fill: "yellow", stroke: "lightgray" }),
                                // define a horizontal Panel to place the node's text alongside the buttons
                                $(go.Panel, "Horizontal",
                                  $(go.TextBlock,
                                    // set the attribute "editable" to true, so users can change the value of the textblock
                                    { editable: true, font: "15px Roboto, sans-serif", margin: 5, textEdited: okName},
                                    // make data binding "two-way": the textblock of the diagram reflects the real data of the model; and any change to the textblock's content would update the data of the model
                                    new go.Binding("text", "text").makeTwoWay()),
                                  
                                  // define a vertical panel to place the node's two children buttons - left and right branch of the decision tree
                                  $(go.Panel, "Vertical",
                                    { defaultStretch: go.GraphObject.Fill, margin: 3 },
                                    $("Button",  // button A: "Left" button
                                      {
                                      name: "ButtonA",
                                      click: buttonExpandCollapse,
                                      toolTip: tooltipTemplate
                                      },
                                      new go.Binding("portId", "a"),
                                      $(go.TextBlock,
                                        { font: '500 16px Roboto, sans-serif' },
                                        new go.Binding("text", "aText").makeTwoWay())
                                      ),  // end button A
                                    $("Button",  // button B: "Right" button
                                      {
                                      name: "ButtonB",
                                      click: buttonExpandCollapse,
                                      toolTip: tooltipTemplate
                                      },
                                      new go.Binding("portId", "b"),
                                      $(go.TextBlock,
                                        {font: '500 16px Roboto, sans-serif' },
                                        new go.Binding("text", "bText").makeTwoWay())
                                      )  // end button B
                                    
                                    )  // end Vertical Panel
                                  )  // end Horizontal Panel
                                ));  // end Node and call to add


// define the Node template for leaf nodes
        myDiagram.nodeTemplateMap.add("personality",
                              $(go.Node, "Auto",
                                new go.Binding("text", "text"),
                                $(go.Shape, "Rectangle",
                                  { fill: "whitesmoke", stroke: "lightgray" }),
                                $(go.TextBlock,
                                  { font: '13px Roboto, sans-serif',
                                  wrap: go.TextBlock.WrapFit, desiredSize: new go.Size(200, NaN), margin: 5 },
                                  new go.Binding("text", "text"))
                                ));

// define the only Link template
        myDiagram.linkTemplate =
        $(go.Link, go.Link.Orthogonal,  // the whole link panel
          { fromPortId: "" },
          new go.Binding("fromPortId", "fromport"),
          $(go.Shape,  // the link shape
            { stroke: "lightblue", strokeWidth: 2 })
          );

// create the model for the decision tree
        var model =
        $(go.GraphLinksModel,
          { linkFromPortIdProperty: "fromport" });
        // set up the model with the node and link data
        // set every nodes' key and text
        makeNodes(model);
        makeLinks(model);
        myDiagram.model = model;

        // textvalidation function for future use
        function okName(textblock, oldstr, newstr) {
       
            // myDiagram.nodes.each(function(n) {
            //                  console.log(n.text);
            //                  });
            // // node = diagram.findNodeForKey(modelForm.model.getId());
            // // Ext.iterate(nodeCt.nodeData, function(key, value) {
            // // diagram.model.setDataProperty(node, key, value);
            // // }, me);
          
        };
          

        // make all but the start node invisible at the beginning
        myDiagram.nodes.each(function(n) {
                     //console.log(typeof(n.key));
                     if (n.text !== "<x + y + z, {x:= 1, y:=2, z:=3}> || 6") {
                     n.visible = false;
                     }
                     
                     });
        myDiagram.links.each(function(l) {
                             l.visible = false;
                             });

   
        // Declaring all the nodes of the dicision tree
          function makeNodes(model) {
          var nodeDataArray = [
                               { key: "Root" , text: "<x + y + z, {x:= 1, y:=2, z:=3}> || 6"},  // the root node
                               
                               // intermediate nodes: decisions on personality characteristics
                               { key: "0" , text: "<>||{}"},
                               { key: "1" , text: "<>||{}"},
                               
                               { key: "00", text: "<>||{}"},
                               { key: "01", text: "<>||{}" },
                               { key: "10", text: "<>||{}" },
                               { key: "11", text: "<>||{}" },
                               
                               { key: "000", text: "<>||{}" },
                               { key: "001", text: "<>||{}" },
                               { key: "010", text: "<>||{}" },
                               { key: "011", text: "<>||{}" },
                               { key: "100", text: "<>||{}" },
                               { key: "101", text: "<>||{}" },
                               { key: "110", text: "<>||{}" },
                               { key: "111", text: "<>||{}" },
                               
                               // terminal nodes: the personality descriptions
                               { key: "0000", text: "<>||{}" },
                               { key: "0001", text: "<>||{}" },
                               { key: "0010", text: "<>||{}" },
                               { key: "0011", text: "<>||{}" },
                               { key: "0100", text: "<>||{}" },
                               { key: "0101", text: "<>||{}" },
                               { key: "0110", text: "<>||{}" },
                               { key: "0111", text: "<>||{}" },
                               { key: "1000", text: "<>||{}" },
                               { key: "1001", text: "<>||{}" },
                               { key: "1010", text: "<>||{}" },
                               { key: "1011", text: "<>||{}" },
                               { key: "1100", text: "<>||{}" },
                               { key: "1101", text: "<>||{}" },
                               { key: "1110", text: "<>||{}" },
                               { key: "1111", text: "<>||{}" }
                               
                               ];
          //console.log(typeof(nodeDataArray[0].key));
          
          // Provide the same choice information for all of the nodes on each level.
          // The level is implicit in the number of characters in the Key, except for the root node.
          // In a different application, there might be different choices for each node, so the initialization would be above, where the Info's are created.
          // But for this application, it makes sense to share the initialization code based on tree level.
          
          // Common prefix: expanding mechanism
          for (var i = 0; i < nodeDataArray.length; i++) {
          var d = nodeDataArray[i];
          if (d.key === "Root") {    //if the current node is the root
          d.category = "decision";
          d.a = "0" ;   // the next char of the key, if it's "0", go left
          d.aText = "Left";
          d.aToolTip = "The Introvert is “territorial” and desires space and solitude to recover energy.  Introverts enjoy solitary activities such as reading and meditating.  25% of the population.";
          d.b = "1";    // the next char of the key, if it's "0", go right
          d.bText = "Right";
          d.bToolTip = "The Extravert is “sociable” and is energized by the presence of other people.  Extraverts experience loneliness when not in contact with others.  75% of the population.";
          } else {  //if the current node is not the root, and the length of current node's key is d.key.length
          switch (d.key.length) {
          case 1:
          d.category = "decision";
          d.a = "0";
          d.aText = "Left";
          d.aToolTip = "The “intuitive” person bases their lives on predictions and ingenuity.  They consider the future and enjoy planning ahead.  25% of the population.";
          d.b = "1";
          d.bText = "Right";
          d.bToolTip = "The “sensing” person bases their life on facts, thinking primarily of their present situation.  They are realistic and practical.  75% of the population.";
          break;
          case 2:
          d.category = "decision";
          d.a = "0";
          d.aText = "Left";
          d.aToolTip = "The “thinking” person bases their decisions on facts and without personal bias.  They are more comfortable with making impersonal judgments.  50% of the population.";
          d.b = "1";
          d.bText = "Right";
          d.bToolTip = "The “feeling” person bases their decisions on personal experience and emotion.  They make their emotions very visible.  50% of the population.";
          break;
          case 3:
          d.category = "decision";
          d.a = "0";
          d.aText = "Left";
          d.aToolTip = "The “judging” person enjoys closure.  They establish deadlines and take them seriously.  They despise being late.  50% of the population.";
          d.b = "1";
          d.bText = "Right";
          d.bToolTip = "The “perceiving” person likes to keep options open and fluid.  They have little regard for deadlines.  Dislikes making decisions unless they are completely sure they are right.  50% of the population.";
          break;
          case 4:
          d.category = "decision";
          d.a = "0";
          d.aText = "Left";
          d.aToolTip = "The “judging” person enjoys closure.  They establish deadlines and take them seriously.  They despise being late.  50% of the population.";
          d.b = "1";
          d.bText = "Right";
          d.bToolTip = "The “perceiving” person likes to keep options open and fluid.  They have little regard for deadlines.  Dislikes making decisions unless they are completely sure they are right.  50% of the population.";
          break;
          
          default:
          d.category = "personality";   //reach the end of the tree, the original output of the decision tree is "personality".
          break;
          }
          }
          }
          model.nodeDataArray = nodeDataArray;
          }
          
          // The key strings implicitly hold the relationship information, based on their spellings.
          // Other than the root node ("Start"), each node's key string minus its last letter is the
          // key to the "parent" node.
          function makeLinks(model) {
          var linkDataArray = [];
          var nda = model.nodeDataArray;
          for (var i = 0; i < nda.length; i++) {
          var key = nda[i].key;
          if (key === "Root" || key.length === 0) continue;
          // e.g., if key=="INTJ", we want: prefix="INT" and letter="J"
          var prefix = key.slice(0, key.length-1);
          var letter = key.charAt(key.length-1);
          if (prefix.length === 0) prefix = "Root";
          var obj = { from: prefix, fromport: letter, to: key };
          linkDataArray.push(obj);
          }
          model.linkDataArray = linkDataArray;
          }

          
          
          
          
          
          });
       console.log();
       return client;
       });


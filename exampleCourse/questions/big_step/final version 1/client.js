define(["SimpleClient", "text!./question.html", "text!./answer.html", "text!clientCode/externally_graded_submission.html", "clientCode/go" ], function(SimpleClient, questionTemplate, answerTemplate, submissionTemplate, go) {

       
var client = new SimpleClient.SimpleClient({questionTemplate: questionTemplate, submissionTemplate: submissionTemplate, skipRivets: true});


client.on('renderQuestionFinished', function() {
    
        if (window.goSamples) goSamples();  // init for these samples -- you don't need to call this
        var $ = go.GraphObject.make;  // for conciseness in defining templates
        myDiagram = $(go.Diagram, "myDiagramDiv",  // must name or refer to the DIV HTML element
                      {
                      initialContentAlignment: go.Spot.Left,
                      allowSelect: true,  // the user cannot select any part. This line controls whether we can "make changes" to the node panel
                      // create a TreeLayout for the decision tree
                      layout: $(go.TreeLayout),
                      "undoManager.isEnabled": true  // enable undo & redo
                      });

        // custom behavior for expanding/collapsing half of the subtree from a node

        //myDiagram.toolManager.textEditingTool.defaultTextEditor = window.TextEditor;
        

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
                                    { editable: true, font: "15px Roboto, sans-serif", margin: 5, textEdited: okName},
                                    new go.Binding("text", "text").makeTwoWay()),
                                  
                                  // define a vertical panel to place the node's two buttons one above the other
                                  $(go.Panel, "Vertical",
                                    { defaultStretch: go.GraphObject.Fill, margin: 3 },
                                    $("Button",  // button A
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
                                    $("Button",  // button B
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

                     //console.log(typeof(n.key));

        // myDiagram.nodes.each(function(n){
        //     // myDiagram.startTransaction('updateNode');
        //              //console.log(typeof(n.key));
        //     var data = myDiagram.model.findNodeDataForKey(n.key);
        //     myDiagram.model.setDataProperty(data, "text", n.text + "ss");
                    

        //     // node = diagram.findNodeForKey(modelForm.model.getId());
        //     // Ext.iterate(nodeCt.nodeData, function(key, value) {
        //     // diagram.model.setDataProperty(node, key, value);
        //     // }, me);
        //     // myDiagram.commitTransaction('updateNode');
        // });

        function okName(textblock, oldstr, newstr) {
       
            // myDiagram.nodes.each(function(n) {
            //                  console.log(n.text);
            //                  });
            // // node = diagram.findNodeForKey(modelForm.model.getId());
            // // Ext.iterate(nodeCt.nodeData, function(key, value) {
            // // diagram.model.setDataProperty(node, key, value);
            // // }, me);
          
        };
          

        // make all but the start node invisible
        myDiagram.nodes.each(function(n) {
                     //console.log(typeof(n.key));
                     if (n.text !== "x + y + z || {x:= 1, y:=2, z:=3}") {
                     n.visible = false;
                     }
                     
                     });
        myDiagram.links.each(function(l) {
                             l.visible = false;
                             });
//
//          var modelAsText = myDiagram.model.toJson();
          // var answer = JSON.stringify(myDiagram.model.nodeDataArray);
          // console.log(answer);
   
          
          function makeNodes(model) {
          var nodeDataArray = [
                               { key: "Problem" , text: "x + y + z || {x:= 1, y:=2, z:=3}"},  // the root node
                               
                               // intermediate nodes: decisions on personality characteristics
                               { key: "I" , text: "<>||{}"},
                               { key: "E" , text: "<>||{}"},
                               
                               { key: "IN", text: "<>||{}"},
                               { key: "IS", text: "<>||{}" },
                               { key: "EN", text: "<>||{}" },
                               { key: "ES", text: "<>||{}" },
                               
                               { key: "INT", text: "<>||{}" },
                               { key: "INF", text: "<>||{}" },
                               { key: "IST", text: "<>||{}" },
                               { key: "ISF", text: "<>||{}" },
                               { key: "ENT", text: "<>||{}" },
                               { key: "ENF", text: "<>||{}" },
                               { key: "EST", text: "<>||{}" },
                               { key: "ESF", text: "<>||{}" },
                               
                               // terminal nodes: the personality descriptions
                               { key: "INTJ",
                               text: ""},
                               { key: "INTP",
                                text: ""},
                               { key: "INFJ",
                               text: ""},
                               //text: "INFJ: Author\nFocus on possibilities.  Place emphasis on values and come to decisions easily.  They have a strong drive to contribute to the welfare of others.  1% of population."},
                               { key: "INFP",
                               text: ""},
                               //text: "INFP: Questor\nPresent a calm and pleasant face to the world.  Although they seem reserved, they are actually very idealistic and care passionately about a few special people or a cause.  1% of the population."},
                               { key: "ISTJ",
                               text: ""},
                               //text: "ISTJ: Trustee\nISTJs like organized lives. They are dependable and trustworthy, as they dislike chaos and work on a task until completion. They prefer to deal with facts rather than emotions. 6% of the population."},
                               { key: "ISTP",
                               text: ""},
                               //text: "ISTP: Artisan\nISTPs are quiet people who are very capable at analyzing how things work. Though quiet, they can be influential, with their seclusion making them all the more skilled. 17% of the population."},
                               { key: "ISFJ",
                               text: ""},
                               //text: "ISFJ: Conservator\nISFJs are not particularly social and tend to be most concerned with maintaining order in their lives. They are dutiful, respectful towards, and interested in others, though they are often shy. They are, therefore, trustworthy, but not bossy. 6% of the population."},
                               { key: "ISFP",
                               text: ""},
                               //text: "ISFP: Author\nFocus on possibilities.  Place emphasis on values and come to decisions easily.  They have a strong drive to contribute to the welfare of others.  1% of population."},
                               { key: "ENTJ",
                               text: ""},
                               //text: "ENTJ: Fieldmarshal\nThe driving force of this personality is to lead.  They like to impose structure and harness people to work towards distant goals.  They reject inefficiency.  5% of the population."},
                               { key: "ENTP",
                               text: ""},
                               //text: "ENTP: Inventor\nExercise their ingenuity by dealing with social, physical, and mechanical relationships.  They are always sensitive to future possibilities.  5% of the population."},
                               { key: "ENFJ",
                               text: ""},
                               //text: "ENFJ: Pedagogue\nExcellent leaders; they are charismatic and never doubt that others will follow them and do as they ask.   They place a high value on cooperation.  5% of the population."},
                               { key: "ENFP",
                               text: ""},
                               //text: "ENFP: Journalist\nPlace significance in everyday occurrences.  They have great ability to understand the motives of others.  They see life as a great drama.  They have a great impact on others.  5% of the population."},
                               { key: "ESTJ",
                               text: ""},
                               //text: "ESTJ: Administrator\nESTJs are pragmatic, and thus well-suited for business or administrative roles. They are traditionalists and conservatives, believing in the status quo. 13% of the population."},
                               { key: "ESTP",
                               text: ""},
                               //text: "ESTP: Promoter\nESTPs tend to manipulate others in order to attain access to the finer aspects of life. However, they enjoy heading to such places with others. They are social and outgoing and are well-connected. 13% of the population."},
                               { key: "ESFJ",
                               text: ""},
                               //text: "ESFJ: Seller\nESFJs tend to be social and concerned for others. They follow tradition and enjoy a structured community environment. Always magnanimous towards others, they expect the same respect and appreciation themselves. 13% of the population."},
                               { key: "ESFP",
                               text: ""},
                               //text: "ESFP: Entertainer\nThe mantra of the ESFP would be \"Carpe Diem.\" They enjoy life to the fullest. They do not, thus, like routines and long-term goals. In general, they are very concerned with others and tend to always try to help others, often perceiving well their needs. 13% of the population."}
                               ];
          //console.log(typeof(nodeDataArray[0].key));
          
          // Provide the same choice information for all of the nodes on each level.
          // The level is implicit in the number of characters in the Key, except for the root node.
          // In a different application, there might be different choices for each node, so the initialization would be above, where the Info's are created.
          // But for this application, it makes sense to share the initialization code based on tree level.
          
          for (var i = 0; i < nodeDataArray.length; i++) {
          var d = nodeDataArray[i];
          if (d.key === "Problem") {
          d.category = "decision";
          d.a = "I" ;
          d.aText = "Left";
          d.aToolTip = "The Introvert is “territorial” and desires space and solitude to recover energy.  Introverts enjoy solitary activities such as reading and meditating.  25% of the population.";
          d.b = "E";
          d.bText = "Right";
          d.bToolTip = "The Extravert is “sociable” and is energized by the presence of other people.  Extraverts experience loneliness when not in contact with others.  75% of the population.";
          } else {
          switch (d.key.length) {
          case 1:
          d.category = "decision";
          d.a = "N";
          d.aText = "Left";
          d.aToolTip = "The “intuitive” person bases their lives on predictions and ingenuity.  They consider the future and enjoy planning ahead.  25% of the population.";
          d.b = "S";
          d.bText = "Right";
          d.bToolTip = "The “sensing” person bases their life on facts, thinking primarily of their present situation.  They are realistic and practical.  75% of the population.";
          break;
          case 2:
          d.category = "decision";
          d.a = "T";
          d.aText = "Left";
          d.aToolTip = "The “thinking” person bases their decisions on facts and without personal bias.  They are more comfortable with making impersonal judgments.  50% of the population.";
          d.b = "F";
          d.bText = "Right";
          d.bToolTip = "The “feeling” person bases their decisions on personal experience and emotion.  They make their emotions very visible.  50% of the population.";
          break;
          case 3:
          d.category = "decision";
          d.a = "J";
          d.aText = "Left";
          d.aToolTip = "The “judging” person enjoys closure.  They establish deadlines and take them seriously.  They despise being late.  50% of the population.";
          d.b = "P";
          d.bText = "Right";
          d.bToolTip = "The “perceiving” person likes to keep options open and fluid.  They have little regard for deadlines.  Dislikes making decisions unless they are completely sure they are right.  50% of the population.";
          break;
          
          default:
          d.category = "personality";
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
          if (key === "Problem" || key.length === 0) continue;
          // e.g., if key=="INTJ", we want: prefix="INT" and letter="J"
          var prefix = key.slice(0, key.length-1);
          var letter = key.charAt(key.length-1);
          if (prefix.length === 0) prefix = "Problem";
          var obj = { from: prefix, fromport: letter, to: key };
          linkDataArray.push(obj);
          }
          model.linkDataArray = linkDataArray;
          }

          
          
          
          
          
          });
       console.log();
       return client;
       });


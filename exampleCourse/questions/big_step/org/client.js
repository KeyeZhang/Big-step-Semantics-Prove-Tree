define(["SimpleClient", "text!./question.html", "text!./answer.html"], function(SimpleClient, questionTemplate, answerTemplate) {
       return new SimpleClient.SimpleClient({questionTemplate: questionTemplate, answerTemplate: answerTemplate});
       });

if (document.getElementById('proofTreeDraw') == 'undefined') {
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.id = 'proofTreeDraw';
    script.src = '/clientFilesCourse/prooftree-draw-helper.js'
    
    if (location.hostname != 'localhost') {
        script.src = '/clientFilesCourse/prooftree-draw-helper.js'
    }
    
    document.body.appendChild(script);
}

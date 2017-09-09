
define(["SimpleClient", "text!./question.html", "text!./answer.html", "text!./submission.html"], function(SimpleClient, questionTemplate, answerTemplate, submissionTemplate) {
    var client = new SimpleClient.SimpleClient({questionTemplate: questionTemplate, answerTemplate: answerTemplate, submissionTemplate: submissionTemplate});
       console.log(client);
       return client;
});

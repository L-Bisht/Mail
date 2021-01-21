document.addEventListener('DOMContentLoaded', () => {
  document.querySelector('#compose-form').onsubmit = () => {
    console.log('inside compose form');
    // Get the emails of receipients
    var recipients = document.querySelector('#compose-recipients').value;
    // Get the subject of the mail
    var subject = document.querySelector('#compose-subject').value;
    // Get the body of the mail
    var mailBody = document.querySelector('#compose-body').value;
    console.log("mail body");
    console.log(mailBody);
    // Make a post request to send mail
    fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
        recipients: recipients,
        subject: subject,
        body: mailBody
      })
    })
      .then(response => response.json())
      .then(result => {
        // Give an alert based on the status of mail
        if (result.message == "Email sent successfully.") {
          // load sent mailbox if mail is sent
          console.log('Mail sent successfully');
          load_mailbox('sent');
          console.log('Sent box loaded')

          // show the message that mail has been sent
          var message = document.querySelector('#mail-sent');
          message.className = "alert alert-success";
          message.innerHTML = result.message;
          message.style.display = 'block';
        }
        else {
          var message = document.querySelector('#not-sent');
          message.className = "alert alert-danger";
          message.innerHTML = result.error;
          window.scrollTo(0, 0);
          message.style.display = 'block';
        }
      });
    return false;
  }
});
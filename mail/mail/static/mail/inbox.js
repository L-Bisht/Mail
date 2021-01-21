// window.onpopstate = function (event) {
//   if (event.state.page == 'compose') {
//     compose_email;
//   }
//   else {
//     load_mailbox(event.state.page);
//   }
// }

document.addEventListener('DOMContentLoaded', function () {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');
});

function to_localtime(date){
  var time = (new Date(date)).getTime();
  var localOffset = (new Date()).getTimezoneOffset() * 60000;
  var localTime = new Date(time - localOffset);
  var hours = localTime.getHours();
  var minutes = localTime.getMinutes();
  var monthNo = localTime.getMonth();
  var day = localTime.getDate();
  var year = localTime.getFullYear();
  var ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  minutes = minutes < 10 ? '0'+minutes : minutes;
  var month = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var strTime = month[monthNo] + ' ' + day + ' ' + year + ', ' + hours + ':' + minutes + ' ' + ampm;
  return strTime;
}


// Open a mail
function open_mail(id) {
  // Show email view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  if (document.querySelector('#email-view')) {
    document.querySelector('#email-view').remove();
  }

  const mailView = document.createElement('div');
  mailView.id = 'email-view';
  mailView.className = "mb-4 mx-auto mt-2 col-md-10";
  document.querySelector('main').append(mailView);

  fetch(`/emails/${id}`)
    .then(response => response.json())
    .then(email => {
      const sub = document.createElement('h2');
      sub.className = "mail-subject mx-auto p-3 mb-4 mt-2";
      sub.innerHTML = `${email.subject}`
      mailView.append(sub);

      mailView.append(document.createElement('hr'));

      // If email was not read mark it as read
      if (!email.read) {
        fetch(`/emails/${id}`, {
          method: 'PUT',
          body: JSON.stringify({
            read: true
          })
        });
      }

      if (email.sender != user) {
        // Add a reply button
        const reply = document.createElement('button');
        reply.className = "icon-btn mr-2 float-right";
        reply.innerHTML = `<i class="material-icons">reply</i>`;
        reply.title = "reply";
        mailView.append(reply);

        // Open compose mail prefilled with some details
        reply.addEventListener('click', () => {
          compose_email();
          document.querySelector('#compose-recipients').value = email.sender;
          if (email.subject.substring(0, 3) == "Re:") {
            document.querySelector('#compose-subject').value = email.subject;
          }
          else {
            document.querySelector('#compose-subject').value = "Re: " + email.subject;
          }
          document.querySelector('#compose-body').value = `On ${to_localtime(email.timestamp)} ${email.sender} wrote:\r\n${email.body}`;
        });
        var isArchived = email.archived;
        const archive = document.createElement('button');
        archive.className = "icon-btn mr-2 float-right";
        archive.style.color = 'black';
        if (isArchived) {
          archive.innerHTML = '<i class="material-icons">move_to_inbox</i>';
          archive.title = 'Move to inbox';
        }
        else {
          archive.innerHTML = '<i class="material-icons">archive</i>';
          archive.title = 'Archive';
        }
        mailView.append(archive);

        archive.addEventListener('click', () => {
          archive_mail(id, isArchived);
          load_mailbox('inbox');
        });
      }
      
      const mail_details = document.createElement('div');
      mail_details.className = "p-0 m-0";
      mail_details.innerHTML = `<p><strong>From: </strong>${email.sender}</p>
                                <p><strong>To: </strong>${email.recipients}</p>
                                <p><strong>Timestamp: </strong>${to_localtime(email.timestamp)}`;
      mailView.append(mail_details);

      mailView.append(document.createElement('hr'));

      // Add mail body
      const mailBody = document.createElement('div');
      mailBody.id = 'mail-body';
      mailBody.innerHTML = email.body;
      mailView.append(mailBody);
    });
}

// function push_state(name) {
//   history.pushState({ page: name }, "", `${name}`);
// }

function compose_email() {
  // push_state('compose');

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';

  if (document.querySelector('#email-view')) {
    document.querySelector('#email-view').remove();
  }
  document.querySelector('#compose-view').style.display = 'block';

  // Hide the alert box
  document.querySelector('#not-sent').style.display = 'none';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {
  // push_state(mailbox);

  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  if (document.querySelector('#email-view')) {
    document.querySelector('#email-view').remove();
  }
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#mailbox').innerHTML = `${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}`;

  // Fetch and show all the mails in that mailbox
  fetch_mails(mailbox);

  // Hide the success alert box
  document.querySelector('#mail-sent').style.display = 'none';
}

function archive_mail(id, isArchive) {
  fetch(`/emails/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      archived: !isArchive
    })
  })
}

function hide_mails() {
  const inbox = document.querySelector('#inbox-mails');
  const sent = document.querySelector('#sent-mails');
  const archived = document.querySelector('#archive-mails');
  if (inbox != null) {
    inbox.remove();
  }
  if (sent != null) {
    sent.remove();
  }
  if (archived != null) {
    archived.remove();
  }
}

function fetch_mails(mailbox) {
  // Remove all the listed mails
  hide_mails();

  // Create new mailbox element
  const mailboxElement = document.createElement('div');
  mailboxElement.id = `${mailbox}-mails`;
  document.querySelector('#emails-view').append(mailboxElement);

  // Fetch all the mails from servers
  fetch(`/emails/${mailbox}`)
    .then(response => response.json())
    .then(emails => {
      emails.forEach(email => {
        const mail = document.createElement('div');
        mail.className = "mail";

        // If mail is read then change its background color
        if (email.read) {
          mail.style.backgroundColor = 'rgb(241, 233, 233)';
          mail.style.opacity = '0.7';
        }
        else {
          mail.style.backgroundColor = 'white';
          mail.style.opacity = '0.9';
        }

        // Fill mail details in the mail div
        mail.innerHTML = `<p><strong>${email.sender}</strong>&nbsp;${email.subject}</p>`;


        // Show archive/unarchive button if mailbox is not sent
        const isArchived = email.archived;
        if (mailbox != 'sent') {
          // Create archive button
          const archive = document.createElement('button');
          archive.className = "icon-btn float-right";
          archive.style.marginTop = "-35px";
          archive.style.color = 'black';
          if (isArchived) {
            archive.innerHTML = '<i class="material-icons">move_to_inbox</i>';
            archive.title = 'Move to inbox';
          }
          else {
            archive.innerHTML = '<i class="material-icons">archive</i>';
            archive.title = 'Archive';
          }
          mail.append(archive);
        }
        mail.innerHTML += `<p class='timestamp float-right'>${to_localtime(email.timestamp)}</p>`

        document.querySelector(`#${mailbox}-mails`).append(mail);

        // Check if the mail was clicked on
        mail.addEventListener('click', event => {
          // If archived button is clicked
          var element = event.target;
          if (element.parentElement.type == 'submit') {
            element = element.parentElement;
          }
          if (element.type == 'submit') {
            element.disabled = true;
            archive_mail(email.id, isArchived);
            element.parentElement.style.animationPlayState = 'running';
            element.parentElement.addEventListener('animationend', () => {
              element.parentElement.remove();
            });
          }
          else {
            open_mail(email.id);
          }
        });
      });
    });
}
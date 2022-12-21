import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  secure: true,
  host: "smtp.mail.ru",
  port: 465,
  auth: {
    user: 'armmmartirosyann@mail.ru',
    pass: 'TmKHupXqHPBJzgfM1TXQ',
  },
});

class Email {
  static sendActivationEmail(email, token, frontUrl) {
    return transporter.sendMail({
      from: '"Armen" <armmmartirosyann@mail.ru>',
      to: email,
      subject: 'Activate account',
      html: `<a href="${frontUrl}?email=${email}&token=${token}">Activate foodcourt account</a>`
    })
  }

  static sendPasswordChangeEmail(email, token) {
    return transporter.sendMail({
      from: '"Armen" <armmmartirosyann@mail.ru>',
      to: email,
      subject: 'Change password token',
      html: `<div>Foodcourt account token - <b>${token}</b></div>`
    })
  }
}

export default Email

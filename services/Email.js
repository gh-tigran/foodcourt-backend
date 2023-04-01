import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    secure: true,
    host: "smtp.mail.ru",
    port: 465,
    auth: {
        user: 'someonename2023@mail.ru',
        pass: 'HWnaRsP5qdkwnrui1k93',
    },
});

class Email {
    static sendActivationEmail(email, token, frontUrl) {
        return transporter.sendMail({
            from: '"Foodcourt" <someonename2023@mail.ru>',
            to: email,
            subject: 'Активировать аккаунт',
            html: `<a 
                    href="${frontUrl}?email=${email}&token=${token}" 
                    style="display: inline-block; text-decoration: none; background-color: #d1d1d1; width: 100%; padding: 25px 15px; color: #161824; font-family: sans-serif; font-size: 16px; text-align: center"
                    >
                        Активировать аккаунт >
                    </a>`
        })
    }

    static sendPasswordChangeEmail(email, token) {
        return transporter.sendMail({
            from: '"Foodcourt" <someonename2023@mail.ru>',
            to: email,
            subject: 'Ключ',
            html: `<div>Ключ - <b>${token}</b></div>`
        })
    }
}

export default Email

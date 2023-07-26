const nodemailer = require('nodemailer');
const pug = require('pug');
const { htmlToText } = require('html-to-text');
const Transport = require('nodemailer-brevo-transport');

module.exports = class Email {
    constructor(user, url) {
        this.to = user.email;
        this.firstname = user.name.split(' ')[0];
        this.url = url;
        this.from = `Raw NL <${process.env.EMAIL_FROM}>`;
    }

    newTransport() {
        if (process.env.NODE_ENV === 'production') {
            // Create transporter from Brevo (sendinblue) - API -> working
            // return nodemailer.createTransport(
            //     new Transport({ apiKey: process.env.API_KEY })
            // );

            // Create transporter from Brevo (sendinblue) - SMTP
            return nodemailer.createTransport({
                host: 'smtp-relay.brevo.com',
                port: 587,
                auth: {
                    user: 'www.rawnl97@gmail.com',
                    pass: `${process.env.BREVO_SMTP_KEY}`,
                },
            });
        }
        return nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            auth: {
                user: process.env.EMAIL_USERNAME,
                pass: process.env.EMAIL_PASSWORD,
            },
        });
    }

    // Send the actual email
    async sendEmail(template, subject) {
        // 1. Render HTML based on a pug template
        const html = pug.renderFile(
            `${__dirname}/../views/emails/${template}.pug`,
            {
                firstname: this.firstname,
                url: this.url,
                subject,
            }
        );
        // 2. Define email options
        const mailOptions = {
            from: this.from,
            to: this.to,
            subject,
            html,
            text: htmlToText(html),
        };
        // 3. Create transport and send email
        await this.newTransport().sendMail(mailOptions);
    }

    async sendWelcome() {
        await this.sendEmail('welcome', 'Welcome to Natours');
    }
    async sendPasswordReset() {
        await this.sendEmail(
            'passwordReset',
            'Your password reset token (valid for only 10 minutes'
        );
    }
};

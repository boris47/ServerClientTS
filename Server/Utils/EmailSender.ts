
import * as nodemailer from 'nodemailer';
import SMTPTransport = require('nodemailer/lib/smtp-transport');
import SMTPConnection = require('nodemailer/lib/smtp-connection');
import Mail = require('nodemailer/lib/mailer');


export class MailService
{
	private transporter : Mail = null;
	private user : string = '';

	constructor( service : string, user : string, pass : string, bSecure = false )
	{
		this.transporter = nodemailer.createTransport
		(
			<SMTPTransport.Options>
			{
				service: service,
				// if true the connection will use TLS when connecting to server.
				// If false (the default) then TLS is used if server supports the STARTTLS extension.
				// In most cases set this value to true if you are connecting to port 465. For port 587 or 25 keep it false
				secure : bSecure,
				// defines authentication data
				auth: <SMTPTransport.MailOptions>
				{
				// Indicates the authetication type, defaults to ‘login’, other option is ‘oauth2’
				//	type : "Login",
					user: this.user = user,
					pass: pass
				},
				tls: <SMTPConnection.Options>
				{
					// do not fail on invalid certs
					rejectUnauthorized: false
				}
			}
		);
	}

	// to: 'myfriend@yahoo.com, myotherfriend@yahoo.com',
	public async SendEmail( to: string|string[], subject : string, text : string ) : Promise<boolean>
	{
		const bisServerReady = await new Promise<boolean>( ( resolve ) =>
		{
			this.transporter.verify( function( error : Error, success : boolean = true )
			{
				if ( error )
				{
					console.error( `MailService::Error:\n${error.name}:${error.message}` );
					resolve( false );
				}
				else
				{
					resolve( true );
				}
			});
		});

		if ( !bisServerReady )
		{
			return false;
		}

		const mailOptions = <Mail.Options>
		{
			from:		this.user,
		//	sender:		this.user,
			to:			Array.isArray(to) ? to.join(',') : to,
			subject:	subject,
			text:		text
		};

		return new Promise<boolean>( ( resolve ) =>
		{
			this.transporter.sendMail( mailOptions, function( error : Error | null, info : nodemailer.SentMessageInfo )
			{
				if ( error )
				{
					console.error( `MailService:Error\n${error.name}:${error.message}` );
					resolve( false );
				}
				else
				{
					if ( Array.isArray( info.accepted ) && info.accepted.length > 0 )
					{
						info.accepted.forEach( ( m : string ) => console.log( `MailService::Email sent to ${m}` ) );
					}

					if ( Array.isArray( info.rejected ) && info.rejected.length > 0 )
					{
						info.rejected.forEach( ( m : string ) => console.log( `MailService::Email NOT sent to ${m}` ) );
					}
					
/*
					messageSize
					messageTime
*/					
					console.log( `Email sent, message id "${info.messageId}"` );
					resolve( true );
				}
			});
		});
	}
}

/*
let message = {
    ...
    attachments: [
        {   // utf-8 string as an attachment
            filename: 'text1.txt',
            content: 'hello world!'
        },
        {   // binary buffer as an attachment
            filename: 'text2.txt',
            content: new Buffer('hello world!','utf-8')
        },
        {   // file on disk as an attachment
            filename: 'text3.txt',
            path: '/path/to/file.txt' // stream this file
        },
        {   // filename and content type is derived from path
            path: '/path/to/file.txt'
        },
        {   // stream as an attachment
            filename: 'text4.txt',
            content: fs.createReadStream('file.txt')
        },
        {   // define custom content type for the attachment
            filename: 'text.bin',
            content: 'hello world!',
            contentType: 'text/plain'
        },
        {   // use URL as an attachment
            filename: 'license.txt',
            path: 'https://raw.github.com/nodemailer/nodemailer/master/LICENSE'
        },
        {   // encoded string as an attachment
            filename: 'text1.txt',
            content: 'aGVsbG8gd29ybGQh',
            encoding: 'base64'
        },
        {   // data uri as an attachment
            path: 'data:text/plain;base64,aGVsbG8gd29ybGQ='
        },
        {
            // use pregenerated MIME node
            raw: 'Content-Type: text/plain\r\n' +
                 'Content-Disposition: attachment;\r\n' +
                 '\r\n' +
                 'Hello world!'
        }
    ]
}
*/
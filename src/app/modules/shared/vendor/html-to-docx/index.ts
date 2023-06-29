import { JSZip , addFilesToContainer } from './html-to-docx.esm.js';

const minifyHTMLString = ( htmlString ) => {
	try {
		if ( typeof htmlString === 'string' || htmlString instanceof String ) {
			return htmlString.replace( /\n/g , ' ' ).replace( /\r/g , ' ' ).replace( /\r\n/g , ' ' ).replace( /[\t]+\</g , '<' ).replace( /\>[\t ]+\</g , '><' ).replace( /\>[\t ]+$/g , '>' );
		}

		throw new Error( 'invalid html string' );
	} catch ( error ) {
		return null;
	}
};

export async function generateContainer(
	htmlString ,
	headerHTMLString ,
	documentOptions = {} ,
	footerHTMLString?
) {
	const zip = new JSZip();

	let contentHTML = htmlString;
	let headerHTML  = headerHTMLString;
	let footerHTML  = footerHTMLString;
	if ( htmlString ) {
		contentHTML = minifyHTMLString( contentHTML );
	}
	if ( headerHTMLString ) {
		headerHTML = minifyHTMLString( headerHTML );
	}
	if ( footerHTMLString ) {
		footerHTML = minifyHTMLString( footerHTML );
	}

	await addFilesToContainer( zip , contentHTML , documentOptions , headerHTML , footerHTML );

	const buffer = await zip.generateAsync( { type : 'arraybuffer' } );
	if ( Object.prototype.hasOwnProperty.call( global , 'Buffer' ) ) {
		return Buffer.from( new Uint8Array( buffer ) );
	}
	if ( Object.prototype.hasOwnProperty.call( global , 'Blob' ) ) {
		// eslint-disable-next-line no-undef
		return new Blob( [ buffer ] , {
			type : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
		} );
	}
	throw new Error(
		'Add blob support using a polyfill eg https://github.com/bjornstar/blob-polyfill'
	);
}

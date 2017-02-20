var fs = require('fs'),
    path = require('path'),
    Readable = require('stream').Readable,
    zlib = require('zlib');


var parseTorrent = require('parse-torrent'),
    request = require('request');

function TorrentManager(config){
  this.config = config;
  this.torrents = {};
  this.refresh();
}

TorrentManager.prototype.refresh = function(){
  var self = this;

  this.torrents = {};

  var files = fs.readdirSync(this.config.torrentsDir);
  if( !files )
    return;

  files.forEach(function(file){

    var ext, torrent;

    ext = path.extname( file );
    if( ext != '.torrent' )
      return;

    torrent = parseTorrent(fs.readFileSync(self.config.torrentsDir+'/'+file));
    if( !torrent || !torrent.infoHash )
      return;

    torrent.fullPath = self.config.torrentsDir+'/'+file;

    self.torrents[torrent.infoHash] = torrent;

  });

}

TorrentManager.prototype.add = function( torrent, cb ){
  var self = this;

  if( torrent.pipe && torrent.pipe instanceof Function ){

    var torrentBuf = new Buffer(0);

    torrent.on('data', function(data){
      torrentBuf = Buffer.concat([torrentBuf, data]);

    });
    torrent.on('end', function(){

      var ptorrent = null;


      try{
        ptorrent = parseTorrent( torrentBuf );
      } catch( e ) {
        console.log(e);
        if( cb ) cb( e );
        return;
      }

      if( self.torrents[ptorrent.infoHash.toLowerCase()] ){
        cb( new Error("Torrent already present") );
        return;
      }
      fs.writeFileSync( self.config.torrentsDir+'/'+ptorrent.infoHash+'.torrent', torrentBuf );
      self.refresh();

      if( cb ) cb( null );
      return;

    });
  } else if( typeof torrent === 'string' ){

    var ptorrent = null;

    if( /magnet\:.*/i.test(torrent) ){
      if( cb ) cb( new Error("Magnet is unsupported") );
      return;
      try{
        ptorrent = parseTorrent( torrent );

      } catch( e ) {
        if( cb ) cb( e );
        return;
      }

      if( !ptorrent || !ptorrent.infoHash ){
        if( cb ) cb( new Error("Malformed magnet URL") );
        return;
      }

      fs.writeFileSync( self.config.torrentsDir+'/'+ptorrent.infoHash+'.torrent', parseTorrent(ptorrent) );
      self.refresh();

      if( cb ) cb( null );
      return;

    } else if( /https?\:\/\/.*/i.test(torrent) ){
      return this.add( request({ uri: torrent, gzip: true, headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/47.0.2526.106 Safari/537.36"}}), cb );
    } else {
      cb( new Error("Invalid torrent URL") );
    }

  }

}

TorrentManager.prototype.remove = function( infoHash ){
  if( !infoHash )
    return;
  
  fs.unlinkSync( this.config.torrentsDir+'/'+infoHash+'.torrent' );
  this.torrents[infoHash] = undefined;
  this.refresh();
}

module.exports = TorrentManager;

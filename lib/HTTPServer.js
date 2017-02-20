var fs = require('fs'),
    path = require('path');

var express = require('express'),
    bodyParser = require('body-parser'),
    Busboy = require('busboy'),
    torrentStream = require('torrent-stream');

var TorrentManager = require('./TorrentManager.js');


function HTTPServer( config ){

  this.config = config;
  this.server = express();
  this.server.use( bodyParser.urlencoded({ extended: false }) );
  this.server.use( express.static( this.config.publicDir ) );
  this.server.set('view engine', 'ejs');
  this.server.set('views', this.config.viewsDir );

  this.server.listen( this.config.httpPort, function(){
    console.log("HTTP Interface available on port", config.httpPort);
  });


  this.server.all('/', this.onSlash.bind(this) );
  this.server.all('/info/*', this.onInfo.bind(this) );
  this.server.all('/get/*', this.onGet.bind(this) );
  this.server.all('/upload', this.onUpload.bind(this) );
  this.server.all('/remove/*', this.onRemove.bind(this) );
  this.server.all('/download/*', this.onDownload.bind(this) );

  this.torrentManager = new TorrentManager( this.config );

}


HTTPServer.prototype.onSlash = function onSlash( req, res ){
  res.render('index', {req: req, torrents: this.torrentManager.torrents});
}


HTTPServer.prototype.onInfo = function onInfo( req, res ){

  var info_hash = req.url.match(/\/info\/(.*)/i)[1];

  if( !info_hash || info_hash == '' || !this.torrentManager.torrents[info_hash.toLowerCase()] )
    return;

  res.render('info', {req: req, torrent: this.torrentManager.torrents[info_hash.toLowerCase()]});

}

HTTPServer.prototype.onGet = function onGet( req, res ){

  var info_hash = req.url.match(/\/get\/([^\/]*)\//i)[1];
  var filei = req.url.match(/\/get\/[^\/]*\/([^\/]*)/i)[1];

  if( !info_hash || info_hash == '' || !this.torrentManager.torrents[info_hash.toLowerCase()] )
    return;


  var engine = torrentStream( fs.readFileSync(this.torrentManager.torrents[info_hash.toLowerCase()].fullPath) );
  if( !engine )
    return;

  engine.listen(function(){});
  engine.on('ready', function(){
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Length', engine.files[filei].length+'');
    res.setHeader("Content-Disposition", "attachment; filename='" + engine.files[filei].name +"'");
    engine.files[filei].createReadStream().pipe(res);
  });

}

HTTPServer.prototype.onUpload = function onUpload( req, res ){
  var self = this;
  if( req.method == "POST" ){

    var busboy = new Busboy({ headers: req.headers });
    busboy.on('file', function(fieldname, file, filename, encoding, mimetype){
      self.torrentManager.add( file, function( err ){

        res.render('upload', { req: req, err: err, success: 1});
      });

    });

    busboy.on('field', function(fieldname, val, fieldnameTruncated, valTruncated, encoding, mimetype){
      self.torrentManager.add( val, function(err){
        res.render('upload', { req: req, err: err, success: 1});
      });
    });


    req.pipe(busboy);

  } else {
    res.render('upload', { req: req, err: null, success: null});
  }

}

HTTPServer.prototype.onRemove = function onRemove( req, res ){
  var info_hash = req.url.match(/\/remove\/([^\/]*)/i)[1];

  this.torrentManager.remove(info_hash);

  res.redirect( req.headers.referer );
}

HTTPServer.prototype.onDownload = function onDownload( req, res ){

  var info_hash = req.url.match(/\/download\/([^\/]*)/i)[1];

  if( !this.torrentManager.torrents[info_hash] ){
    res.redirect( req.headers.referer );
    return;
  }

  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader('Content-Length', fs.statSync(this.torrentManager.torrents[info_hash].fullPath)['size'] );
  res.setHeader("Content-Disposition", "attachment; filename='" + path.basename(this.torrentManager.torrents[info_hash].name) +".torrent'");
  fs.createReadStream(this.torrentManager.torrents[info_hash].fullPath).pipe(res);

}


module.exports = HTTPServer;

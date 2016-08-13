/**
 * Created by Vlad on 8/13/2016.
 */
///<reference path="../../../typings/jquery.d.ts"/>
///<reference path="../../../typings/FileSystem.d.ts"/>
///<reference path="../../../typings/FileTransfer.d.ts"/>
var uplight;
(function (uplight) {
    var FileLoader = (function () {
        function FileLoader(source, destination) {
            this.source = source;
            this.destination = destination;
            this.download();
        }
        FileLoader.prototype.destroy = function () {
            this.onComplete = null;
            this.onError = null;
        };
        FileLoader.prototype.download = function () {
            var _this = this;
            var fileTransfer = new FileTransfer();
            var url = encodeURI(this.source);
            var dest = this.destination;
            fileTransfer.download(url, dest, function (entry) {
                _this.destination = entry.toURL();
                _this.onComplete(_this);
                console.log("download complete: " + _this.destination);
            }, function (error) {
                this.onError(this);
                console.log("download error source " + error.source);
                console.log("download error target " + error.target);
                console.log("upload error code" + error.code);
            }, false, {
                headers: {
                    "Authorization": "Basic dGVzdHVzZXJuYW1lOnRlc3RwYXNzd29yZA=="
                }
            });
            console.log('start download ' + this.source);
        };
        return FileLoader;
    }());
    uplight.FileLoader = FileLoader;
    var VersionControl = (function () {
        // fileSystem:FileSystem;
        function VersionControl() {
            var _this = this;
            this.server = 'http://192.168.1.10:56888/';
            $.get('version.json').done(function (res) {
                console.log(res);
                _this.myversion = res;
                _this.checkVersion();
            });
        }
        VersionControl.prototype.saveFile = function (filename, dataObj, callBack) {
            window.requestFileSystem(window.PERSISTENT, 0, function (fs) {
                fs.root.getFile(filename, { create: true, exclusive: false }, function (fileEntry) {
                    fileEntry.createWriter(function (fileWriter) {
                        fileWriter.onwriteend = function () { callBack(); };
                        fileWriter.onerror = function (e) {
                            callBack(e);
                        };
                        fileWriter.write(dataObj);
                    });
                }, function (err) { return callBack(err); });
            }, function (err) { return callBack(err); });
        };
        VersionControl.prototype.saveVersion = function () {
        };
        VersionControl.prototype.showError = function (err) {
            $('#Error').text(JSON.parse(err));
        };
        VersionControl.prototype.onDownloadComplete = function () {
            var _this = this;
            if (this.errors.length)
                console.error(this.errors);
            this.saveFile('version.json', JSON.stringify(this.myversion), function (err) {
                if (err)
                    _this.showError(err);
                else {
                    window.location.href = _this.myversion.start;
                }
            });
        };
        VersionControl.prototype.removeLoader = function (loader) {
            var ind = this.downloading.indexOf(loader);
            if (ind !== -1)
                this.downloading.splice(ind, 0);
            loader.destroy();
        };
        VersionControl.prototype.onLoaderComplte = function (loader) {
            this.removeLoader(loader);
            if (this.downloading.length === 0)
                this.onDownloadComplete();
        };
        VersionControl.prototype.onLoaderError = function (loader) {
            this.errors.push('loading ' + loader.source);
            this.removeLoader(loader);
            if (this.downloading.length === 0)
                this.onDownloadComplete();
        };
        VersionControl.prototype.downloadFiles = function () {
            var _this = this;
            var files = this.myversion.download;
            var out = [];
            var server = this.server;
            files.forEach(function (path) {
                var loader = new FileLoader(server + path, path);
                loader.onComplete = function (loader) { return _this.onLoaderComplte(loader); };
                loader.onError = function (loader) { return _this.onLoaderError(loader); };
            });
            this.errors = [];
            this.downloading = out;
        };
        VersionControl.prototype.checkVersion = function () {
            var _this = this;
            $.get(this.server + 'version/' + this.myversion.version).done(function (res) {
                console.log(res);
                var download = res.download;
                if (download && download.length) {
                    _this.myversion = res;
                    _this.downloadFiles();
                }
            });
        };
        return VersionControl;
    }());
    uplight.VersionControl = VersionControl;
})(uplight || (uplight = {}));
var versioncontrol = new uplight.VersionControl();
//# sourceMappingURL=VersionControl.js.map
/**
 * Created by Vlad on 8/13/2016.
 */
///<reference path="../../../typings/jquery.d.ts"/>
    ///<reference path="../../../typings/FileSystem.d.ts"/>
    ///<reference path="../../../typings/FileTransfer.d.ts"/>

module uplight{
    interface MyVesrion{
        version:string;
        download:string[];
        start:string;
    }


    export class FileLoader{
        //fs:FileSystem;

        onComplete:Function;
        onError:Function;
        destroy():void{
            this.onComplete = null;
            this.onError = null;
        }
        constructor(public source:string,public destination:string){
            this.download();
        }

        download():void{
            var fileTransfer = new FileTransfer();
            var url = encodeURI(this.source);
            var dest:string = this.destination;

            fileTransfer.download(
                url,
                dest,
                (entry:FileEntry) =>{
                    this.destination = entry.toURL();
                   this.onComplete(this);
                    console.log("download complete: " + this.destination);
                },
                function(error) {
                    this.onError(this);
                    console.log("download error source " + error.source);
                    console.log("download error target " + error.target);
                    console.log("upload error code" + error.code);
                },
                false,
                {
                    headers: {
                        "Authorization": "Basic dGVzdHVzZXJuYW1lOnRlc3RwYXNzd29yZA=="
                    }
                }
            );

            console.log('start download '+this.source);

        }


    }

    export class VersionControl{

        server:string = 'http://192.168.1.10:56888/'

        myversion:MyVesrion;
       // fileSystem:FileSystem;

        constructor(){

            $.get('version.json').done(
                res=>{
                    console.log(res)
                    this.myversion = res
                    this.checkVersion();
                }
            )
        }



        saveFile(filename:string,dataObj:any,callBack:Function){
            window.requestFileSystem(window.PERSISTENT, 0, function (fs) {
                fs.root.getFile(filename, { create: true, exclusive: false }, function (fileEntry) {

                    fileEntry.createWriter(function (fileWriter) {
                        fileWriter.onwriteend = function() { callBack();  };

                        fileWriter.onerror = function (e) {
                            callBack(e);
                        };

                        fileWriter.write(dataObj);
                    });


                },err=>callBack(err));

            },err=>callBack(err));
        }


        saveVersion():void{

        }

        showError(err:any):void{
            $('#Error').text(JSON.parse(err));
        }
        onDownloadComplete():void{
            if(this.errors.length)console.error(this.errors);

            this.saveFile('version.json',JSON.stringify(this.myversion),(err)=>{
                if(err)this.showError(err)
                else{

                    window.location.href =  this.myversion.start;
                }
            })

        }

        removeLoader(loader:FileLoader):void{
            var ind = this.downloading.indexOf(loader);
            if(ind!==-1)this.downloading.splice(ind,0);
            loader.destroy();
        }
        onLoaderComplte(loader:FileLoader):void{
            this.removeLoader(loader);
            if(this.downloading.length ===0)this.onDownloadComplete();


        }
        private errors:string[]
        onLoaderError(loader:FileLoader):void{
           this.errors.push('loading '+loader.source);
            this.removeLoader(loader)
            if(this.downloading.length ===0)this.onDownloadComplete();
        }

        downloading:FileLoader[];
        downloadFiles():void{
            var files:string[] = this.myversion.download
            var out:FileLoader[]=[];
            var server:string = this.server;
            files.forEach( (path: string)=> {
                var loader:FileLoader = new FileLoader(server+path,path);
                loader.onComplete = (loader:FileLoader)=>this.onLoaderComplte(loader);
                loader.onError = (loader:FileLoader)=>this.onLoaderError(loader);
            })

            this.errors = [];
            this.downloading = out;
        }


        checkVersion():void{
            $.get(this.server+'version/'+this.myversion.version).done(
                (res:MyVesrion)=>{
                    console.log(res)
                    var download :string[] = res.download;
                    if(download && download.length){
                        this.myversion = res;
                        this.downloadFiles();
                    }
                }

            )
        }
}
}


var versioncontrol = new uplight.VersionControl();
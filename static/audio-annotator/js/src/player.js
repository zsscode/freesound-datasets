// Player prototype
function Player(Options)
{
    this.wavesurfer;
    this.playBar;
    this.view;
    this.fs_id = Options.freesound_id;
    this.playerDom = "#s" + this.fs_id;
    this.height = Options.height;
    this.ws_container = this.playerDom + " .wavesurfer";
    this.spectrogram = Options.spectrogram_url;
    this.waveform = Options.waveform_url;
    this.sound_url = Options.sound_url;

    // Create wavesurfer object (playback and mouse interaction)
    this.wavesurfer = Object.create(WaveSurfer);
    this.wavesurfer.init({
        container: this.ws_container,
        height: this.height
    });

    // Create view
    this.view = new View(this);
    this.view.create();

    // Create play bar
    this.playBar = new PlayBar(this);
    this.playBar.create();

    $(this.ws_container).children("wave").css({
        "width": "100%",
        "overflow": "hidden"
    });

    this.addEvents();
    this.load();
}

Player.prototype = {
    load: function() {
        var pl = this;
        pl.wavesurfer.load(pl.sound_url);
    },

    addEvents: function() {
        var pl = this;
        pl.wavesurfer.on("ready", function() {
            pl.playBar.update();
        });
    }
};

Player.activePlayer = null;

// View prototype
function View(player) {
    this.player = player;
    this.playerDom = this.player.playerDom;
    this.wavesurfer = this.player.wavesurfer;
    this.ws_container = this.player.ws_container;
    this.height = this.player.height;
    this.spectrogram = this.player.spectrogram;
    this.waveform = this.player.waveform;
    this.viewDom = null;
    this.clickable = $(this.ws_container).find("> wave");
    this.progressBar = $(this.ws_container).find("wave wave");
    this.progressBar.addClass("progress-bar");
}

View.prototype = {
    create: function () {
        var pl = this;
        pl.addWaveSurferEvents();

        // Create background element
        var height_px = pl.height + "px";
        var viewBckg = $("<div>", {
            class: "view spectrogram"
        });
        viewBckg.css({
            "height": height_px,
            "background-image": "url(" + pl.spectrogram + ")",
            "background-repeat": "no-repeat",
            "background-size": "100% 100%"
        });

        pl.viewDom = [viewBckg];

        $(pl.ws_container).append(pl.viewDom);
    },

    switch: function () {
        var pl = this;
        var view = $(pl.ws_container).find(".view");
        var bckg_img = (view.hasClass("spectrogram") ? pl.waveform : pl.spectrogram);
        view.toggleClass("spectrogram").toggleClass("waveform");
        view.css({
            "background-image": "url(" + bckg_img + ")"
        });
    },

    getHorizontalCoordinates: function(e) {
        var pl = this;
        var offset = pl.clickable.offset();
        var width = pl.clickable.width();
        return (e.pageX - offset.left) / width;
    },

    updateProgressBar: function(pos) {
        var pl = this;
        var progress = pos || pl.wavesurfer.getCurrentTime() / pl.wavesurfer.getDuration();
        progress *= 100;

        pl.progressBar.css({
            "width": progress + "%"
        });
    },

    addWaveSurferEvents: function () {
        var pl = this;

        pl.wavesurfer.on("audioprocess", function () {
            pl.updateProgressBar();
        });

        pl.wavesurfer.on("finish", function () {
            pl.updateProgressBar();
        });

        pl.clickable.on("click", function (e) {
            var x = pl.getHorizontalCoordinates(e);
            pl.wavesurfer.seekTo(x);
            pl.updateProgressBar(x);
        })
    }
};

// Play bar prototype
function PlayBar(player) {
    this.player = player;
    this.playerDom = this.player.playerDom;
    this.wavesurfer = this.player.wavesurfer;
    this.playBarDom = null;
}

PlayBar.prototype = {
    create: function() {
        var pl = this;
        pl.addWaveSurferEvents();

        // Create play button
        var playButton = $("<button>", {
            class: "ui icon button play_pause",
            title: "Play/pause clip"
        });
        var playIcon = $("<i>", {
            class: "play icon",
        });
        playButton.append(playIcon);
        playButton.click(function() {
            pl.wavesurfer.playPause();
        });

        // Create stop button
        var restartButton = $("<button>", {
            class: "ui icon button restart",
            title: "Restart clip"
        });
        var restartIcon = $("<i>", {
            class: "step backward icon"
        });
        restartButton.append(restartIcon);
        restartButton.click(function() {
           pl.wavesurfer.stop();
           pl.wavesurfer.play();
        });

        // Create switch view button
        var switchButton = $("<button>", {
            class: "ui icon button switch",
            title: "Switch view"
        });
        var switchIcon = $("<i>", {
            class: "eye icon"
        });
        switchButton.append(switchIcon);
        switchButton.click(function () {
            pl.player.view.switch();
        });

        var controls = [playButton, restartButton, switchButton];

        var controlsDiv = $("<div>", {
            class: "ui horizontal buttons controls"
        });
        controlsDiv.append(controls);

        var timerDiv = $("<div>", {
            class: "ui right floated"
        });
        var timer = $("<span>", {
            class: "timer"
        });
        //timer.text(pl.wavesurfer.getDuration());
        timerDiv.append(timer);

        this.playBarDom = [controlsDiv, timerDiv];
    },

    update: function() {
        pl = this;
        $(pl.playBarDom).detach();
        $(pl.playerDom).find(".playbar").append(pl.playBarDom);
        pl.updateTimer();
    },

    updateTimer: function() {
        pl = this;
        timerText = pl.getTimerText();
        $(pl.playerDom).find(".playbar").find(".timer").text(timerText);
    },

    getTimerText: function() {
        var pl = this;
        var secondsToString = function (seconds) {
            if (seconds === null) {
                return '';
            }
            var timeStr = '00:';
            if (seconds >= 10) {
                timestr += seconds.toFixed(0);
            } else {
                timeStr += '0' + seconds.toFixed(0);
            }
            return timeStr;
        };

        return secondsToString(pl.wavesurfer.getCurrentTime()) +
            ' / ' + secondsToString(pl.wavesurfer.getDuration());
    },

    addWaveSurferEvents: function() {
        var pl = this;

        pl.wavesurfer.on("play", function () {
            var playerDom = pl.playerDom;
            var button = $(playerDom).find(".play_pause");
            // Stop all and store current player
            if(Player.activePlayer !== null && Player.activePlayer !== pl.player)
                Player.activePlayer.wavesurfer.stop();
            Player.activePlayer = pl.player;
            // Change icon
            button.find(".play").removeClass("play").addClass("pause");
        });

        pl.wavesurfer.on("pause", function () {
            var playerDom = pl.playerDom;
            var button = $(playerDom).find(".play_pause");
            // Change icon
            button.find(".pause").removeClass("pause").addClass("play");
        });

        pl.wavesurfer.on("seek", function () {
            pl.updateTimer();
            pl.player.view.updateProgressBar();
        });

        pl.wavesurfer.on("audioprocess", function () {
            pl.updateTimer();
        });
    }
};
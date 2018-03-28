/*! wavesurfer.js 1.1.1 (Mon, 04 Apr 2016 09:49:47 GMT)
 * https://github.com/katspaugh/wavesurfer.js
 * @license CC-BY-3.0 */
! function (a, b) {
    "function" == typeof define && define.amd ? define("wavesurfer", [], function () {
        return a.WaveSurfer = b()
    }) : "object" == typeof exports ? module.exports = b() : a.WaveSurfer = b()
}(this, function () {
    "use strict";
    var a = {
        defaultParams: {
            height: 128,
            waveColor: "#999",
            progressColor: "#555",
            cursorColor: "#333",
            cursorWidth: 1,
            skipLength: 2,
            minPxPerSec: 20,
            pixelRatio: window.devicePixelRatio || screen.deviceXDPI / screen.logicalXDPI,
            fillParent: !0,
            scrollParent: !1,
            hideScrollbar: !1,
            normalize: !1,
            audioContext: null,
            container: null,
            dragSelection: !0,
            loopSelection: !0,
            audioRate: 1,
            interact: !0,
            splitChannels: !1,
            channel: -1,
            mediaContainer: null,
            mediaControls: !1,
            renderer: "Canvas",
            backend: "WebAudio",
            mediaType: "audio",
            autoCenter: !0
        },
        init: function (b) {
            if (this.params = a.util.extend({}, this.defaultParams, b), this.container = "string" == typeof b.container ? document.querySelector(this.params.container) : this.params.container, !this.container) throw new Error("Container element not found");
            if (null == this.params.mediaContainer ? this.mediaContainer = this.container : "string" == typeof this.params.mediaContainer ? this.mediaContainer = document.querySelector(this.params.mediaContainer) : this.mediaContainer = this.params.mediaContainer, !this.mediaContainer) throw new Error("Media Container element not found");
            this.savedVolume = 0, this.isMuted = !1, this.tmpEvents = [], this.currentAjax = null, this.createDrawer(), 
            this.createBackend()
        },
        createDrawer: function () {
            var b = this;
            this.drawer = Object.create(a.Drawer[this.params.renderer]), this.drawer.init(this.container, this.params), this.drawer.on("redraw", function () {
                b.drawBuffer(), b.drawer.progress(b.backend.getPlayedPercents())
            }), /*this.drawer.on("click", function (a, c) {
                setTimeout(function () {
                    b.seekTo(c)
                }, 0)
            }),*/ this.drawer.on("scroll", function (a) {
                b.fireEvent("scroll", a)
            })
        },
        createBackend: function () {
            var b = this;
            this.backend && this.backend.destroy(), "AudioElement" == this.params.backend && (this.params.backend = "MediaElement"), "WebAudio" != this.params.backend || a.WebAudio.supportsWebAudio() || (this.params.backend = "MediaElement"), this.backend = Object.create(a[this.params.backend]), this.backend.init(this.params), this.backend.on("finish", function () {
                b.fireEvent("finish")
            }), this.backend.on("play", function () {
                b.fireEvent("play")
            }), this.backend.on("pause", function () {
                b.fireEvent("pause")
            }), this.backend.on("audioprocess", function (a) {
                b.fireEvent("audioprocess", a)
            })
        },
        startAnimationLoop: function () {
            var a = this,
                b = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame,
                c = function () {
                    if (!a.backend.isPaused()) {
                        var d = a.backend.getPlayedPercents();
                        a.drawer.progress(d), a.fireEvent("audioprocess", a.getCurrentTime()), b(c)
                    }
                };
            c()
        },
        getDuration: function () {
            return this.backend.getDuration()
        },
        getCurrentTime: function () {
            return this.backend.getCurrentTime()
        },
        play: function (a, b) {
            this.backend.play(a, b), this.startAnimationLoop()
        },
        pause: function () {
            this.backend.pause()
        },
        playPause: function () {
            this.backend.isPaused() ? this.play() : this.pause()
        },
        isPlaying: function () {
            return !this.backend.isPaused()
        },
        skipBackward: function (a) {
            this.skip(-a || -this.params.skipLength)
        },
        skipForward: function (a) {
            this.skip(a || this.params.skipLength)
        },
        skip: function (a) {
            var b = this.getCurrentTime() || 0,
                c = this.getDuration() || 1;
            b = Math.max(0, Math.min(c, b + (a || 0))), this.seekAndCenter(b / c)
        },
        seekAndCenter: function (a) {
            this.seekTo(a), this.drawer.recenter(a)
        },
        seekTo: function (a) {
            var b = this.backend.isPaused(),
                c = this.params.scrollParent;
            b && (this.params.scrollParent = !1), this.backend.seekTo(a * this.getDuration()), /*this.drawer.progress(this.backend.getPlayedPercents()),*/ b || (this.backend.pause(), this.backend.play()), this.params.scrollParent = c, this.fireEvent("seek", a)
        },
        stop: function () {
            this.pause(), this.seekTo(0), this.drawer.progress(0)
        },
        setVolume: function (a) {
            this.backend.setVolume(a)
        },
        setPlaybackRate: function (a) {
            this.backend.setPlaybackRate(a)
        },
        toggleMute: function () {
            this.isMuted ? (this.backend.setVolume(this.savedVolume), this.isMuted = !1) : (this.savedVolume = this.backend.getVolume(), this.backend.setVolume(0), this.isMuted = !0)
        },
        toggleScroll: function () {
            this.params.scrollParent = !this.params.scrollParent, this.drawBuffer()
        },
        toggleInteraction: function () {
            this.params.interact = !this.params.interact
        },
        drawBuffer: function () {
            return;
            var a = Math.round(this.getDuration() * this.params.minPxPerSec * this.params.pixelRatio),
                b = this.drawer.getWidth(),
                c = a;
            this.params.fillParent && (!this.params.scrollParent || b > a) && (c = b);
            var d = this.backend.getPeaks(c);
            this.drawer.drawPeaks(d, c), this.fireEvent("redraw", d, c)
        },
        zoom: function (a) {
            this.params.minPxPerSec = a, this.params.scrollParent = !0, this.drawBuffer(), this.seekAndCenter(this.getCurrentTime() / this.getDuration()), this.fireEvent("zoom", a)
        },
        setChannel: function (a) {
            this.params.channel = a, this.drawer.clearWave(), this.drawBuffer(), this.backend.setChannel(a)
        },
        loadArrayBuffer: function (a) {
            this.decodeArrayBuffer(a, function (a) {
                this.loadDecodedBuffer(a)
            }.bind(this))
        },
        loadDecodedBuffer: function (a) {
            this.backend.load(a), this.drawBuffer(), this.fireEvent("ready")
        },
        loadBlob: function (a) {
            var b = this,
                c = new FileReader;
            c.addEventListener("progress", function (a) {
                b.onProgress(a)
            }), c.addEventListener("load", function (a) {
                b.loadArrayBuffer(a.target.result)
            }), c.addEventListener("error", function () {
                b.fireEvent("error", "Error reading file")
            }), c.readAsArrayBuffer(a), this.empty()
        },
        load: function (a, b) {
            switch (this.params.backend) {
                case "WebAudio":
                    return this.loadBuffer(a);
                case "MediaElement":
                    return this.loadMediaElement(a, b)
            }
        },
        loadBuffer: function (a) {
            return this.empty(), this.getArrayBuffer(a, this.loadArrayBuffer.bind(this))
        },
        loadMediaElement: function (a, b) {
            this.empty(), this.backend.load(a, this.mediaContainer, b), this.tmpEvents.push(this.backend.once("canplay", function () {
                this.drawBuffer(), this.fireEvent("ready")
            }.bind(this)), this.backend.once("error", function (a) {
                this.fireEvent("error", a)
            }.bind(this))), !b && this.backend.supportsWebAudio() && this.getArrayBuffer(a, function (a) {
                this.decodeArrayBuffer(a, function (a) {
                    this.backend.buffer = a, this.drawBuffer()
                }.bind(this))
            }.bind(this))
        },
        decodeArrayBuffer: function (a, b) {
            this.backend.decodeArrayBuffer(a, this.fireEvent.bind(this, "decoded"), this.fireEvent.bind(this, "error", "Error decoding audiobuffer")), this.tmpEvents.push(this.once("decoded", b))
        },
        getArrayBuffer: function (b, c) {
            var d = this,
                e = a.util.ajax({
                    url: b,
                    responseType: "arraybuffer"
                });
            return this.currentAjax = e, this.tmpEvents.push(e.on("progress", function (a) {
                d.onProgress(a)
            }), e.on("success", function (a, b) {
                c(a), d.currentAjax = null
            }), e.on("error", function (a) {
                d.fireEvent("error", "XHR error: " + a.target.statusText), d.currentAjax = null
            })), e
        },
        onProgress: function (a) {
            if (a.lengthComputable) var b = a.loaded / a.total;
            else b = a.loaded / (a.loaded + 1e6);
            this.fireEvent("loading", Math.round(100 * b), a.target)
        },
        exportPCM: function (a, b, c) {
            a = a || 1024, b = b || 1e4, c = c || !1;
            var d = this.backend.getPeaks(a, b),
                e = [].map.call(d, function (a) {
                    return Math.round(a * b) / b
                }),
                f = JSON.stringify(e);
            return c || window.open("data:application/json;charset=utf-8," + encodeURIComponent(f)), f
        },
        cancelAjax: function () {
            this.currentAjax && (this.currentAjax.xhr.abort(), this.currentAjax = null)
        },
        clearTmpEvents: function () {
            this.tmpEvents.forEach(function (a) {
                a.un()
            })
        },
        empty: function () {
            this.backend.isPaused() || (this.stop(), this.backend.disconnectSource()), this.cancelAjax(), this.clearTmpEvents(), this.drawer.progress(0), this.drawer.setWidth(0), this.drawer.drawPeaks({
                length: this.drawer.getWidth()
            }, 0)
        },
        destroy: function () {
            this.fireEvent("destroy"), this.cancelAjax(), this.clearTmpEvents(), this.unAll(), this.backend.destroy(), this.drawer.destroy()
        }
    };
    return a.create = function (b) {
            var c = Object.create(a);
            return c.init(b), c
        }, a.util = {
            extend: function (a) {
                var b = Array.prototype.slice.call(arguments, 1);
                return b.forEach(function (b) {
                    Object.keys(b).forEach(function (c) {
                        a[c] = b[c]
                    })
                }), a
            },
            min: function (a) {
                var b = +(1 / 0);
                for (var c in a) a[c] < b && (b = a[c]);
                return b
            },
            max: function (a) {
                var b = -(1 / 0);
                for (var c in a) a[c] > b && (b = a[c]);
                return b
            },
            getId: function () {
                return "wavesurfer_" + Math.random().toString(32).substring(2)
            },
            ajax: function (b) {
                var c = Object.create(a.Observer),
                    d = new XMLHttpRequest,
                    e = !1;
                return d.open(b.method || "GET", b.url, !0), d.responseType = b.responseType || "json", d.addEventListener("progress", function (a) {
                    c.fireEvent("progress", a), a.lengthComputable && a.loaded == a.total && (e = !0)
                }), d.addEventListener("load", function (a) {
                    e || c.fireEvent("progress", a), c.fireEvent("load", a), 200 == d.status || 206 == d.status ? c.fireEvent("success", d.response, a) : c.fireEvent("error", a)
                }), d.addEventListener("error", function (a) {
                    c.fireEvent("error", a)
                }), d.send(), c.xhr = d, c
            }
        }, a.Observer = {
            on: function (a, b) {
                this.handlers || (this.handlers = {});
                var c = this.handlers[a];
                return c || (c = this.handlers[a] = []), c.push(b), {
                    name: a,
                    callback: b,
                    un: this.un.bind(this, a, b)
                }
            },
            un: function (a, b) {
                if (this.handlers) {
                    var c = this.handlers[a];
                    if (c)
                        if (b)
                            for (var d = c.length - 1; d >= 0; d--) c[d] == b && c.splice(d, 1);
                        else c.length = 0
                }
            },
            unAll: function () {
                this.handlers = null
            },
            once: function (a, b) {
                var c = this,
                    d = function () {
                        b.apply(this, arguments), setTimeout(function () {
                            c.un(a, d)
                        }, 0)
                    };
                return this.on(a, d)
            },
            fireEvent: function (a) {
                if (this.handlers) {
                    var b = this.handlers[a],
                        c = Array.prototype.slice.call(arguments, 1);
                    b && b.forEach(function (a) {
                        a.apply(null, c)
                    })
                }
            }
        }, a.util.extend(a, a.Observer), a.WebAudio = {
            scriptBufferSize: 256,
            PLAYING_STATE: 0,
            PAUSED_STATE: 1,
            FINISHED_STATE: 2,
            supportsWebAudio: function () {
                return !(!window.AudioContext && !window.webkitAudioContext)
            },
            getAudioContext: function () {
                return a.WebAudio.audioContext || (a.WebAudio.audioContext = new(window.AudioContext || window.webkitAudioContext)), a.WebAudio.audioContext
            },
            getOfflineAudioContext: function (b) {
                return a.WebAudio.offlineAudioContext || (a.WebAudio.offlineAudioContext = new(window.OfflineAudioContext || window.webkitOfflineAudioContext)(1, 2, b)), a.WebAudio.offlineAudioContext
            },
            init: function (b) {
                this.params = b, this.ac = b.audioContext || this.getAudioContext(), this.lastPlay = this.ac.currentTime, this.startPosition = 0, this.scheduledPause = null, this.states = [Object.create(a.WebAudio.state.playing), Object.create(a.WebAudio.state.paused), Object.create(a.WebAudio.state.finished)], this.createVolumeNode(), this.createScriptNode(), this.createAnalyserNode(), this.setState(this.PAUSED_STATE), this.setPlaybackRate(this.params.audioRate)
            },
            disconnectFilters: function () {
                this.filters && (this.filters.forEach(function (a) {
                    a && a.disconnect()
                }), this.filters = null, this.analyser.connect(this.splitter))
            },
            setState: function (a) {
                this.state !== this.states[a] && (this.state = this.states[a], this.state.init.call(this))
            },
            setFilter: function () {
                this.setFilters([].slice.call(arguments))
            },
            setFilters: function (a) {
                this.disconnectFilters(), a && a.length && (this.filters = a, this.analyser.disconnect(), a.reduce(function (a, b) {
                    return a.connect(b), b
                }, this.analyser).connect(this.splitter))
            },
            createScriptNode: function () {
                this.ac.createScriptProcessor ? this.scriptNode = this.ac.createScriptProcessor(this.scriptBufferSize) : this.scriptNode = this.ac.createJavaScriptNode(this.scriptBufferSize), this.scriptNode.connect(this.ac.destination)
            },
            addOnAudioProcess: function () {
                var a = this;
                this.scriptNode.onaudioprocess = function () {
                    var b = a.getCurrentTime();
                    b >= a.getDuration() ? (a.setState(a.FINISHED_STATE), a.fireEvent("pause")) : b >= a.scheduledPause ? (a.setState(a.PAUSED_STATE), a.fireEvent("pause")) : a.state === a.states[a.PLAYING_STATE] && a.fireEvent("audioprocess", b)
                }
            },
            removeOnAudioProcess: function () {
                this.scriptNode.onaudioprocess = null
            },
            createChannelNodes: function () {
                var a = this.buffer.numberOfChannels;
                this.splitter = this.ac.createChannelSplitter(a), this.merger = this.ac.createChannelMerger(a), this.setChannel(this.params.channel), this.analyser.disconnect(), this.analyser.connect(this.splitter), this.merger.connect(this.gainNode)
            },
            setChannel: function (a) {
                var b = this.buffer.numberOfChannels;
                this.splitter.disconnect();
                for (var c = 0; b > c; c++) this.splitter.connect(this.merger, -1 === a ? c : a, c)
            },
            createAnalyserNode: function () {
                this.analyser = this.ac.createAnalyser(), this.analyser.connect(this.gainNode)
            },
            createVolumeNode: function () {
                this.ac.createGain ? this.gainNode = this.ac.createGain() : this.gainNode = this.ac.createGainNode(), this.gainNode.connect(this.ac.destination)
            },
            setVolume: function (a) {
                this.gainNode.gain.value = a
            },
            getVolume: function () {
                return this.gainNode.gain.value
            },
            decodeArrayBuffer: function (a, b, c) {
                this.offlineAc || (this.offlineAc = this.getOfflineAudioContext(this.ac ? this.ac.sampleRate : 44100)), this.offlineAc.decodeAudioData(a, function (a) {
                    b(a)
                }.bind(this), c)
            },
            getPeaks: function (a) {
                for (var b = this.buffer.length / a, c = ~~(b / 10) || 1, d = this.buffer.numberOfChannels, e = [], f = [], g = 0; d > g; g++)
                    for (var h = e[g] = [], i = this.buffer.getChannelData(g), j = 0; a > j; j++) {
                        for (var k = ~~(j * b), l = ~~(k + b), m = 0, n = 0, o = k; l > o; o += c) {
                            var p = i[o];
                            p > n && (n = p), m > p && (m = p)
                        }
                        h[2 * j] = n, h[2 * j + 1] = m, (0 == g || n > f[2 * j]) && (f[2 * j] = n), (0 == g || m < f[2 * j + 1]) && (f[2 * j + 1] = m)
                    }
                return this.params.splitChannels || this.params.channel > -1 ? e : f
            },
            getPlayedPercents: function () {
                return this.state.getPlayedPercents.call(this)
            },
            disconnectSource: function () {
                this.source && this.source.disconnect()
            },
            destroy: function () {
                this.isPaused() || this.pause(), this.unAll(), this.buffer = null, this.disconnectFilters(), this.disconnectSource(), this.gainNode.disconnect(), this.scriptNode.disconnect(), this.merger.disconnect(), this.splitter.disconnect(), this.analyser.disconnect()
            },
            load: function (a) {
                this.startPosition = 0, this.lastPlay = this.ac.currentTime, this.buffer = a, this.createSource(), this.createChannelNodes()
            },
            createSource: function () {
                this.disconnectSource(), this.source = this.ac.createBufferSource(), this.source.start = this.source.start || this.source.noteGrainOn, this.source.stop = this.source.stop || this.source.noteOff, this.source.playbackRate.value = this.playbackRate, this.source.buffer = this.buffer, this.source.connect(this.analyser)
            },
            isPaused: function () {
                return this.state !== this.states[this.PLAYING_STATE]
            },
            getDuration: function () {
                return this.buffer ? this.buffer.duration : 0
            },
            seekTo: function (a, b) {
                return this.scheduledPause = null, null == a && (a = this.getCurrentTime(), a >= this.getDuration() && (a = 0)), null == b && (b = this.getDuration()), this.startPosition = a, this.lastPlay = this.ac.currentTime, this.state === this.states[this.FINISHED_STATE] && this.setState(this.PAUSED_STATE), {
                    start: a,
                    end: b
                }
            },
            getPlayedTime: function () {
                return (this.ac.currentTime - this.lastPlay) * this.playbackRate
            },
            play: function (a, b) {
                this.createSource();
                var c = this.seekTo(a, b);
                a = c.start, b = c.end, this.scheduledPause = b, this.source.start(0, a, b - a), this.setState(this.PLAYING_STATE), this.fireEvent("play")
            },
            pause: function () {
                this.scheduledPause = null, this.startPosition += this.getPlayedTime(), this.source && this.source.stop(0), this.setState(this.PAUSED_STATE), this.fireEvent("pause")
            },
            getCurrentTime: function () {
                return this.state.getCurrentTime.call(this)
            },
            setPlaybackRate: function (a) {
                a = a || 1, this.isPaused() ? this.playbackRate = a : (this.pause(), this.playbackRate = a, this.play())
            }
        }, a.WebAudio.state = {}, a.WebAudio.state.playing = {
            init: function () {
                this.addOnAudioProcess()
            },
            getPlayedPercents: function () {
                var a = this.getDuration();
                return this.getCurrentTime() / a || 0
            },
            getCurrentTime: function () {
                return this.startPosition + this.getPlayedTime()
            }
        }, a.WebAudio.state.paused = {
            init: function () {
                this.removeOnAudioProcess()
            },
            getPlayedPercents: function () {
                var a = this.getDuration();
                return this.getCurrentTime() / a || 0
            },
            getCurrentTime: function () {
                return this.startPosition
            }
        }, a.WebAudio.state.finished = {
            init: function () {
                this.removeOnAudioProcess(), this.fireEvent("finish")
            },
            getPlayedPercents: function () {
                return 1
            },
            getCurrentTime: function () {
                return this.getDuration()
            }
        }, a.util.extend(a.WebAudio, a.Observer), a.MediaElement = Object.create(a.WebAudio), a.util.extend(a.MediaElement, {
            init: function (a) {
                this.params = a, this.media = {
                    currentTime: 0,
                    duration: 0,
                    paused: !0,
                    playbackRate: 1,
                    play: function () {},
                    pause: function () {}
                }, this.mediaType = a.mediaType.toLowerCase(), this.elementPosition = a.elementPosition, this.setPlaybackRate(this.params.audioRate)
            },
            load: function (a, b, c) {
                var d = this,
                    e = document.createElement(this.mediaType);
                e.controls = this.params.mediaControls, e.autoplay = this.params.autoplay || !1, e.preload = "auto", e.src = a, e.style.width = "100%", e.addEventListener("error", function () {
                    d.fireEvent("error", "Error loading media element")
                }), e.addEventListener("canplay", function () {
                    d.fireEvent("canplay")
                }), e.addEventListener("ended", function () {
                    d.fireEvent("finish")
                }), e.addEventListener("timeupdate", function () {
                    d.fireEvent("audioprocess", d.getCurrentTime())
                });
                var f = b.querySelector(this.mediaType);
                f && b.removeChild(f), b.appendChild(e), this.media = e, this.peaks = c, this.onPlayEnd = null, this.buffer = null, this.setPlaybackRate(this.playbackRate)
            },
            isPaused: function () {
                return !this.media || this.media.paused
            },
            getDuration: function () {
                var a = this.media.duration;
                return a >= 1 / 0 && (a = this.media.seekable.end()), a
            },
            getCurrentTime: function () {
                return this.media && this.media.currentTime
            },
            getPlayedPercents: function () {
                return this.getCurrentTime() / this.getDuration() || 0
            },
            setPlaybackRate: function (a) {
                this.playbackRate = a || 1, this.media.playbackRate = this.playbackRate
            },
            seekTo: function (a) {
                null != a && (this.media.currentTime = a), this.clearPlayEnd()
            },
            play: function (a, b) {
                this.seekTo(a), this.media.play(), b && this.setPlayEnd(b), this.fireEvent("play")
            },
            pause: function () {
                this.media && this.media.pause(), this.clearPlayEnd(), this.fireEvent("pause")
            },
            setPlayEnd: function (a) {
                var b = this;
                this.onPlayEnd = function (c) {
                    c >= a && (b.pause(), b.seekTo(a))
                }, this.on("audioprocess", this.onPlayEnd)
            },
            clearPlayEnd: function () {
                this.onPlayEnd && (this.un("audioprocess", this.onPlayEnd), this.onPlayEnd = null)
            },
            getPeaks: function (b) {
                return this.buffer ? a.WebAudio.getPeaks.call(this, b) : this.peaks || []
            },
            getVolume: function () {
                return this.media.volume
            },
            setVolume: function (a) {
                this.media.volume = a
            },
            destroy: function () {
                this.pause(), this.unAll(), this.media && this.media.parentNode && this.media.parentNode.removeChild(this.media), this.media = null
            }
        }), a.AudioElement = a.MediaElement, a.Drawer = {
            init: function (a, b) {
                this.container = a, this.params = b, this.width = 0, this.height = b.height * this.params.pixelRatio, this.lastPos = 0, this.initDrawer(b), this.createWrapper(), this.createElements()
            },
            createWrapper: function () {
                this.wrapper = this.container.appendChild(document.createElement("wave")), this.style(this.wrapper, {
                    display: "block",
                    position: "relative",
                    userSelect: "none",
                    webkitUserSelect: "none",
                    height: this.params.height + "px"
                }), (this.params.fillParent || this.params.scrollParent) && this.style(this.wrapper, {
                    width: "100%",
                    overflowX: this.params.hideScrollbar ? "hidden" : "auto",
                    overflowY: "hidden"
                }), this.setupWrapperEvents()
            },
            handleEvent: function (a) {
                a.preventDefault();
                var b, c = this.wrapper.getBoundingClientRect(),
                    d = this.width,
                    e = this.getWidth();
                return !this.params.fillParent && e > d ? (b = (a.clientX - c.left) * this.params.pixelRatio / d || 0, b > 1 && (b = 1)) : b = (a.clientX - c.left + this.wrapper.scrollLeft) / this.wrapper.scrollWidth || 0, b
            },
            setupWrapperEvents: function () {
                var a = this;
                this.wrapper.addEventListener("click", function (b) {
                    var c = a.wrapper.offsetHeight - a.wrapper.clientHeight;
                    if (0 != c) {
                        var d = a.wrapper.getBoundingClientRect();
                        if (b.clientY >= d.bottom - c) return
                    }
                    a.params.interact && a.fireEvent("click", b, a.handleEvent(b))
                }), this.wrapper.addEventListener("scroll", function (b) {
                    a.fireEvent("scroll", b)
                })
            },
            drawPeaks: function (a, b) {
                this.resetScroll(), this.setWidth(b), this.params.barWidth ? this.drawBars(a) : this.drawWave(a)
            },
            style: function (a, b) {
                return Object.keys(b).forEach(function (c) {
                    a.style[c] !== b[c] && (a.style[c] = b[c])
                }), a
            },
            resetScroll: function () {
                null !== this.wrapper && (this.wrapper.scrollLeft = 0)
            },
            recenter: function (a) {
                var b = this.wrapper.scrollWidth * a;
                this.recenterOnPosition(b, !0)
            },
            recenterOnPosition: function (a, b) {
                var c = this.wrapper.scrollLeft,
                    d = ~~(this.wrapper.clientWidth / 2),
                    e = a - d,
                    f = e - c,
                    g = this.wrapper.scrollWidth - this.wrapper.clientWidth;
                if (0 != g) {
                    if (!b && f >= -d && d > f) {
                        var h = 5;
                        f = Math.max(-h, Math.min(h, f)), e = c + f
                    }
                    e = Math.max(0, Math.min(g, e)), e != c && (this.wrapper.scrollLeft = e)
                }
            },
            getWidth: function () {
                return Math.round(this.container.clientWidth * this.params.pixelRatio)
            },
            setWidth: function (a) {
                a != this.width && (this.width = a, this.params.fillParent || this.params.scrollParent ? this.style(this.wrapper, {
                    width: ""
                }) : this.style(this.wrapper, {
                    width: ~~(this.width / this.params.pixelRatio) + "px"
                }), this.updateSize())
            },
            setHeight: function (a) {
                a != this.height && (this.height = a, this.style(this.wrapper, {
                    height: ~~(this.height / this.params.pixelRatio) + "px"
                }), this.updateSize())
            },
            progress: function (a) {
                var b = 1 / this.params.pixelRatio,
                    c = Math.round(a * this.width) * b;
                if (c < this.lastPos || c - this.lastPos >= b) {
                    if (this.lastPos = c, this.params.scrollParent && this.params.autoCenter) {
                        var d = ~~(this.wrapper.scrollWidth * a);
                        this.recenterOnPosition(d)
                    }
                    this.updateProgress(a)
                }
            },
            destroy: function () {
                this.unAll(), this.wrapper && (this.container.removeChild(this.wrapper), this.wrapper = null)
            },
            initDrawer: function () {},
            createElements: function () {},
            updateSize: function () {},
            drawWave: function (a, b) {},
            clearWave: function () {},
            updateProgress: function (a) {}
        }, a.util.extend(a.Drawer, a.Observer), a.Drawer.Canvas = Object.create(a.Drawer), a.util.extend(a.Drawer.Canvas, {
            createElements: function () {
                var a = this.wrapper.appendChild(this.style(document.createElement("canvas"), {
                    position: "absolute",
                    zIndex: 1,
                    left: 0,
                    top: 0,
                    bottom: 0
                }));
                if (this.waveCc = a.getContext("2d"), this.progressWave = this.wrapper.appendChild(this.style(document.createElement("wave"), {
                        position: "absolute",
                        zIndex: 2,
                        left: 0,
                        top: 0,
                        bottom: 0,
                        overflow: "hidden",
                        width: "0",
                        display: "none",
                        boxSizing: "border-box",
                        borderRightStyle: "solid",
                        borderRightWidth: this.params.cursorWidth + "px",
                        borderRightColor: this.params.cursorColor
                    })), this.params.waveColor != this.params.progressColor) {
                    var b = this.progressWave.appendChild(document.createElement("canvas"));
                    this.progressCc = b.getContext("2d")
                }
            },
            updateSize: function () {
                var a = Math.round(this.width / this.params.pixelRatio);
                this.waveCc.canvas.width = this.width, this.waveCc.canvas.height = this.height, this.style(this.waveCc.canvas, {
                    width: a + "px"
                }), this.style(this.progressWave, {
                    display: "block"
                }), this.progressCc && (this.progressCc.canvas.width = this.width, this.progressCc.canvas.height = this.height, this.style(this.progressCc.canvas, {
                    width: a + "px"
                })), this.clearWave()
            },
            clearWave: function () {
                this.waveCc.clearRect(0, 0, this.width, this.height), this.progressCc && this.progressCc.clearRect(0, 0, this.width, this.height)
            },
            drawBars: function (a, b) {
                if (a[0] instanceof Array) {
                    var c = a;
                    if (this.params.splitChannels) return this.setHeight(c.length * this.params.height * this.params.pixelRatio), void c.forEach(this.drawBars, this);
                    if (this.params.channel > -1) {
                        if (this.params.channel >= c.length) throw new Error("Channel doesn't exist");
                        a = c[this.params.channel]
                    } else a = c[0]
                }
                var d = [].some.call(a, function (a) {
                    return 0 > a
                });
                d && (a = [].filter.call(a, function (a, b) {
                    return b % 2 == 0
                }));
                var e = .5 / this.params.pixelRatio,
                    f = this.width,
                    g = this.params.height * this.params.pixelRatio,
                    h = g * b || 0,
                    i = g / 2,
                    j = a.length,
                    k = this.params.barWidth * this.params.pixelRatio,
                    l = Math.max(this.params.pixelRatio, ~~(k / 2)),
                    m = k + l,
                    n = 1;
                this.params.normalize && (n = Math.max.apply(Math, a));
                var o = j / f;
                this.waveCc.fillStyle = this.params.waveColor, this.progressCc && (this.progressCc.fillStyle = this.params.progressColor), [this.waveCc, this.progressCc].forEach(function (b) {
                    if (b)
                        for (var c = 0; f > c; c += m) {
                            var d = Math.round(a[Math.floor(c * o)] / n * i);
                            b.fillRect(c + e, i - d + h, k + e, 2 * d)
                        }
                }, this)
            },
            drawWave: function (a, b) {
                if (a[0] instanceof Array) {
                    var c = a;
                    if (this.params.splitChannels) return this.setHeight(c.length * this.params.height * this.params.pixelRatio), void c.forEach(this.drawWave, this);
                    if (this.params.channel > -1) {
                        if (this.params.channel >= c.length) throw new Error("Channel doesn't exist");
                        a = c[this.params.channel]
                    } else a = c[0]
                }
                var d = [].some.call(a, function (a) {
                    return 0 > a
                });
                if (!d) {
                    for (var e = [], f = 0, g = a.length; g > f; f++) e[2 * f] = a[f], e[2 * f + 1] = -a[f];
                    a = e
                }
                var h = .5 / this.params.pixelRatio,
                    i = this.params.height * this.params.pixelRatio,
                    j = i * b || 0,
                    k = i / 2,
                    l = ~~(a.length / 2),
                    m = 1;
                this.params.fillParent && this.width != l && (m = this.width / l);
                var n = 1;
                if (this.params.normalize) {
                    var o = Math.max.apply(Math, a),
                        p = Math.min.apply(Math, a);
                    n = -p > o ? -p : o
                }
                this.waveCc.fillStyle = this.params.waveColor, this.progressCc && (this.progressCc.fillStyle = this.params.progressColor), [this.waveCc, this.progressCc].forEach(function (b) {
                    if (b) {
                        b.beginPath(), b.moveTo(h, k + j);
                        for (var c = 0; l > c; c++) {
                            var d = Math.round(a[2 * c] / n * k);
                            b.lineTo(c * m + h, k - d + j)
                        }
                        for (var c = l - 1; c >= 0; c--) {
                            var d = Math.round(a[2 * c + 1] / n * k);
                            b.lineTo(c * m + h, k - d + j)
                        }
                        b.closePath(), b.fill(), b.fillRect(0, k + j - h, this.width, h)
                    }
                }, this)
            },
            updateProgress: function (a) {
                var b = Math.round(this.width * a) / this.params.pixelRatio;
                this.style(this.progressWave, {
                    width: b + "px"
                })
            }
        }), a.Drawer.MultiCanvas = Object.create(a.Drawer), a.util.extend(a.Drawer.MultiCanvas, {
            initDrawer: function (a) {
                if (this.maxCanvasWidth = null != a.maxCanvasWidth ? a.maxCanvasWidth : 4e3, this.maxCanvasElementWidth = Math.round(this.maxCanvasWidth / this.params.pixelRatio), this.maxCanvasWidth <= 1) throw "maxCanvasWidth must be greater than 1.";
                if (this.maxCanvasWidth % 2 == 1) throw "maxCanvasWidth must be an even number.";
                this.hasProgressCanvas = this.params.waveColor != this.params.progressColor, this.halfPixel = .5 / this.params.pixelRatio, this.canvases = []
            },
            createElements: function () {
                this.progressWave = this.wrapper.appendChild(this.style(document.createElement("wave"), {
                    position: "absolute",
                    zIndex: 2,
                    left: 0,
                    top: 0,
                    bottom: 0,
                    overflow: "hidden",
                    width: "0",
                    display: "none",
                    boxSizing: "border-box",
                    borderRightStyle: "solid",
                    borderRightWidth: this.params.cursorWidth + "px",
                    borderRightColor: this.params.cursorColor
                })), this.addCanvas()
            },
            updateSize: function () {
                for (var a = Math.round(this.width / this.params.pixelRatio), b = Math.ceil(a / this.maxCanvasElementWidth); this.canvases.length < b;) this.addCanvas();
                for (; this.canvases.length > b;) this.removeCanvas();
                for (var c in this.canvases) {
                    var d = this.maxCanvasWidth + 2 * Math.ceil(this.params.pixelRatio / 2);
                    c == this.canvases.length - 1 && (d = this.width - this.maxCanvasWidth * (this.canvases.length - 1)), this.updateDimensions(this.canvases[c], d, this.height), this.clearWave(this.canvases[c])
                }
            },
            addCanvas: function () {
                var a = {},
                    b = this.maxCanvasElementWidth * this.canvases.length;
                a.wave = this.wrapper.appendChild(this.style(document.createElement("canvas"), {
                    position: "absolute",
                    zIndex: 1,
                    left: b + "px",
                    top: 0,
                    bottom: 0
                })), a.waveCtx = a.wave.getContext("2d"), this.hasProgressCanvas && (a.progress = this.progressWave.appendChild(this.style(document.createElement("canvas"), {
                    position: "absolute",
                    left: b + "px",
                    top: 0,
                    bottom: 0
                })), a.progressCtx = a.progress.getContext("2d")), this.canvases.push(a)
            },
            removeCanvas: function () {
                var a = this.canvases.pop();
                a.wave.parentElement.removeChild(a.wave), this.hasProgressCanvas && a.progress.parentElement.removeChild(a.progress)
            },
            updateDimensions: function (a, b, c) {
                var d = Math.round(b / this.params.pixelRatio);
                a.waveCtx.canvas.width = b, a.waveCtx.canvas.height = c, this.style(a.waveCtx.canvas, {
                    width: d + "px"
                }), this.style(this.progressWave, {
                    display: "block"
                }), this.hasProgressCanvas && (a.progressCtx.canvas.width = b, a.progressCtx.canvas.height = c, this.style(a.progressCtx.canvas, {
                    width: d + "px"
                }))
            },
            clearWave: function (a) {
                a.waveCtx.clearRect(0, 0, a.waveCtx.canvas.width, a.waveCtx.canvas.height), this.hasProgressCanvas && a.progressCtx.clearRect(0, 0, a.progressCtx.canvas.width, a.progressCtx.canvas.height)
            },
            drawBars: function (b, c) {
                if (b[0] instanceof Array) {
                    var d = b;
                    if (this.params.splitChannels) return this.setHeight(d.length * this.params.height * this.params.pixelRatio), void d.forEach(this.drawBars, this);
                    b = d[0]
                }
                var e = [].some.call(b, function (a) {
                    return 0 > a
                });
                e && (b = [].filter.call(b, function (a, b) {
                    return b % 2 == 0
                }));
                var f = this.width,
                    g = this.params.height * this.params.pixelRatio,
                    h = g * c || 0,
                    i = g / 2,
                    j = b.length,
                    k = this.params.barWidth * this.params.pixelRatio,
                    l = Math.max(this.params.pixelRatio, ~~(k / 2)),
                    m = k + l,
                    n = 1;
                this.params.normalize && (n = a.util.max(b));
                var o = j / f;
                this.canvases[0].waveCtx.fillStyle = this.params.waveColor, this.canvases[0].progressCtx && (this.canvases[0].progressCtx.fillStyle = this.params.progressColor);
                for (var p = 0; f > p; p += m) {
                    var q = Math.round(b[Math.floor(p * o)] / n * i);
                    this.fillRect(p + this.halfPixel, i - q + h, k + this.halfPixel, 2 * q)
                }
            },
            drawWave: function (b, c) {
                if (b[0] instanceof Array) {
                    var d = b;
                    if (this.params.splitChannels) return this.setHeight(d.length * this.params.height * this.params.pixelRatio), void d.forEach(this.drawWave, this);
                    b = d[0]
                }
                var e = [].some.call(b, function (a) {
                    return 0 > a
                });
                if (!e) {
                    for (var f = [], g = 0, h = b.length; h > g; g++) f[2 * g] = b[g], f[2 * g + 1] = -b[g];
                    b = f
                }
                var i = this.params.height * this.params.pixelRatio,
                    j = i * c || 0,
                    k = i / 2,
                    l = ~~(b.length / 2),
                    m = 1;
                this.params.fillParent && this.width != l && (m = this.width / l);
                var n = 1;
                if (this.params.normalize) {
                    var o = a.util.max(b),
                        p = a.util.min(b);
                    n = -p > o ? -p : o
                }
                this.drawLine(l, b, n, k, m, j), this.fillRect(0, k + j - this.halfPixel, this.width, this.halfPixel)
            },
            drawLine: function (a, b, c, d, e, f) {
                for (var g in this.canvases) {
                    var h = this.canvases[g];
                    this.setFillStyles(h), this.drawLineToContext(h.waveCtx, g, b, c, d, e, f), this.drawLineToContext(h.progressCtx, g, b, c, d, e, f)
                }
            },
            drawLineToContext: function (a, b, c, d, e, f, g) {
                if (a) {
                    var h = b * this.maxCanvasWidth,
                        i = h + a.canvas.width + 1;
                    a.beginPath(), a.moveTo(this.halfPixel, e + g);
                    for (var j = h; i > j; j++) {
                        var k = Math.round(c[2 * j] / d * e);
                        a.lineTo((j - h) * f + this.halfPixel, e - k + g)
                    }
                    for (var j = i - 1; j >= h; j--) {
                        var k = Math.round(c[2 * j + 1] / d * e);
                        a.lineTo((j - h) * f + this.halfPixel, e - k + g)
                    }
                    a.closePath(), a.fill()
                }
            },
            fillRect: function (a, b, c, d) {
                for (var e in this.canvases) {
                    var f = this.canvases[e],
                        g = e * this.maxCanvasWidth,
                        h = {
                            x1: Math.max(a, e * this.maxCanvasWidth),
                            y1: b,
                            x2: Math.min(a + c, e * this.maxCanvasWidth + f.waveCtx.canvas.width),
                            y2: b + d
                        };
                    h.x1 < h.x2 && (this.setFillStyles(f), this.fillRectToContext(f.waveCtx, h.x1 - g, h.y1, h.x2 - h.x1, h.y2 - h.y1), this.fillRectToContext(f.progressCtx, h.x1 - g, h.y1, h.x2 - h.x1, h.y2 - h.y1))
                }
            },
            fillRectToContext: function (a, b, c, d, e) {
                a && a.fillRect(b, c, d, e)
            },
            setFillStyles: function (a) {
                a.waveCtx.fillStyle = this.params.waveColor, this.hasProgressCanvas && (a.progressCtx.fillStyle = this.params.progressColor)
            },
            updateProgress: function (a) {
                var b = Math.round(this.width * a) / this.params.pixelRatio;
                this.style(this.progressWave, {
                    width: b + "px"
                })
            }
        }),
        function () {
            var b = function () {
                var b = document.querySelectorAll("wavesurfer");
                Array.prototype.forEach.call(b, function (b) {
                    var c = a.util.extend({
                        container: b,
                        backend: "MediaElement",
                        mediaControls: !0
                    }, b.dataset);
                    b.style.display = "block";
                    var d = a.create(c);
                    if (b.dataset.peaks) var e = JSON.parse(b.dataset.peaks);
                    d.load(b.dataset.url, e)
                })
            };
            "complete" === document.readyState ? b() : window.addEventListener("load", b)
        }(), a
});
//# sourceMappingURL=wavesurfer.min.js.map
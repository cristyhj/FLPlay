
folder = /mnt/c/webOS_TV_SDK/CLI/bin/
device = -d sufregerie
all: build install launch inspect
half: build install launch

restart: install launch inspect

build:
	$(folder)ares-package --no-minify FLPlayApp FLPlayService

inspect: inspect-app inspect-service

inspect-app:
	$(folder)ares-inspect $(device) -a com.nelson.flplay -o &

inspect-service:
	$(folder)ares-inspect $(device) -s com.nelson.flplay.service -o &

launch:
	$(folder)ares-launch $(device) com.nelson.flplay

install:
	$(folder)ares-install $(device) ./com.nelson.flplay_0.0.1_all.ipk

clean:
	rm ./com.nelson.flplay_0.0.1_all.ipk
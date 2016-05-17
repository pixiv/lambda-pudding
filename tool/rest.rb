#!/usr/bin/env ruby
require 'rest-client'
require 'erb'

url_head = "https://************.execute-api.ap-northeast-1.amazonaws.com/dev"

# p RestClient.get "#{url_head}/ads?place_id=#{ERB::Util.url_encode("foo")}"

p RestClient.post "#{url_head}/conversion", {:place_id => "100", :ads_id => "1002" }.to_json, :content_type => 'application/json'
p RestClient.get "#{url_head}/conversion?place_id=100&ads_id=1002"
#
# p RestClient.get "#{url_head}/admin/ads"
# p RestClient.get "#{url_head}/admin/ads/1"
# p RestClient.delete "#{url_head}/admin/ads/2"
#
# p RestClient.put "#{url_head}/admin/ads/3", {:ads_info => {:title => "ジョジョ" }}.to_json, :content_type => 'application/json'
#
# p RestClient.delete "#{url_head}/admin/places/#{ERB::Util.url_encode("遊戯王")}"
# p RestClient.put "#{url_head}/admin/places/#{ERB::Util.url_encode("剣道")}", {}.to_json, :content_type => 'application/json'

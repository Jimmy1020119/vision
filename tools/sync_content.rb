# frozen_string_literal: true

require 'date'
require 'digest'
require 'fileutils'
require 'open3'
require 'pathname'
require 'yaml'

ROOT = File.expand_path('..', __dir__)
source = File.expand_path(ARGV.fetch(0, File.join(ROOT, '_content-source')))
raise 'Canonical blog source is missing' unless File.directory?(File.join(source, '_posts'))

def read_document(path)
  raw = File.read(path, encoding: 'UTF-8').gsub("\r\n", "\n")
  match = raw.match(/\A---\n(.*?)\n---\n(.*)\z/m)
  raise "Missing Markdown front matter: #{path}" unless match
  data = YAML.safe_load(match[1], permitted_classes: [Date, Time, DateTime], aliases: true) || {}
  [data, match[2], raw]
end

posts_dir = File.join(ROOT, '_posts')
asset_dir = File.join(ROOT, 'assets', 'content')
[posts_dir, asset_dir].each do |directory|
  raise 'Unexpected generated content path' unless directory.start_with?(ROOT + File::SEPARATOR)
  FileUtils.rm_rf(directory)
  FileUtils.mkdir_p(directory)
end
if File.directory?(File.join(source, 'assets'))
  FileUtils.cp_r(File.join(source, 'assets', '.'), asset_dir)
end

categories = {'Project' => 'Projects', 'Projects' => 'Projects', 'Paper Review' => 'Paper Notes', 'Paper Notes' => 'Paper Notes', 'Startup' => 'Startup'}
localized = 0
files = Dir.glob(File.join(source, '_posts', '*.{md,markdown}')).sort
raise 'Refusing to publish an empty canonical blog' if files.empty?

files.each do |file|
  metadata, body, raw = read_document(file)
  translation = File.join(ROOT, 'content', 'en', File.basename(file))
  if File.file?(translation)
    english, english_body, = read_document(translation)
    if english['source_sha256'] == Digest::SHA256.hexdigest(raw.strip)
      body = english_body
      %w[title description tags thumbnail thumbnail_alt].each do |key|
        metadata[key] = english[key] if english.key?(key)
      end
      localized += 1
    end
  end
  metadata['categories'] = Array(metadata['categories']).map { |category| categories.fetch(category, category) }
  slug = File.basename(file).sub(/\A\d{4}-\d{2}-\d{2}-/, '').sub(/\.(?:md|markdown)\z/, '')
  metadata['canonical_url'] = "https://jimmy1020119.github.io/posts/#{slug}/"

  # Local assets belong to the canonical content checkout. Theme assets remain
  # separate so a source-blog image can never replace the robot or site styles.
  body = body.gsub(%r{(?<=["'(])/assets/([^\s"'<>)]*)}) do
    "{{ '/assets/content/#{Regexp.last_match(1)}' | relative_url }}"
  end
  body = body.gsub(%r{https://docs\.google\.com/presentation/(d/e/[^/]+)/pubembed}, 'https://docs.google.com/presentation/\1/embed')
  if metadata['image'].is_a?(String) && metadata['image'].start_with?('/assets/')
    metadata['image'] = metadata['image'].sub('/assets/', '/assets/content/')
  end
  File.write(File.join(posts_dir, File.basename(file)), "#{YAML.dump(metadata)}---\n#{body}", encoding: 'UTF-8')
end

revision, status = Open3.capture2('git', '-C', source, 'rev-parse', 'HEAD')
raise 'Unable to record canonical source revision' unless status.success?
File.write(File.join(ROOT, '_data', 'content_sync.yml'), YAML.dump({'repository' => 'Jimmy1020119/Jimmy1020119.github.io', 'revision' => revision.strip, 'posts' => files.size, 'english_views' => localized}))
puts "Imported #{files.size} canonical posts (#{localized} version-matched English views), source #{revision.strip}"

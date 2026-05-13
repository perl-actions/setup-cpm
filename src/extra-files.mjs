export const batchFile = `
@setlocal EnableExtensions
@set "ERRORLEVEL="
@perl "%~dp0cpm" %* || goto :error
:error
@"%COMSPEC%" /d/c "@exit %ERRORLEVEL%"
`.replace(/\s*/, '');

export const cpmScript = `
#!/usr/bin/env perl
use strict;
use warnings;
use File::Basename ();
use File::Spec ();
my $DIR = File::Spec->rel2abs(File::Basename::dirname(__FILE__));
require "$DIR/lib/CartonSnapshotTiny.pm";
do "$DIR/script/cpm";
die $@ if $@;
`.replace(/\s*/, '');

export const fakeCartonSnapshot = `
{
use strict;
use warnings;

# this is a minimized version of Carton::Snapshot providing only what is needed
# by cpm, with no dependencies.
# https://github.com/perl-actions/setup-cpm

package Carton::Snapshot::Tiny;
{
  local $@;
  if (!eval { require Carton::Snapshot }) {
    $INC{'Carton/Snapshot.pm'} = 1;
    push @Carton::Snapshot::ISA, __PACKAGE__;
  }
}

sub new {
  my ($class, %args) = @_;
  my $self = bless {
    path => $args{path},
    distributions => [],
  }, $class;
}

sub load {
    my $self = shift;

    return 1 if $self->{loaded};

    open my $fh, '<:utf8', $self->{path}
      or die "Can't find cpanfile.snapshot: Run \`carton install\` to build the snapshot file.";

    $self->_parse($fh);

    $self->{loaded} = 1;
}

sub path { $_[0]->{path} }

sub find {
    my($self, $module) = @_;
    (grep $_->{provides}{$module}, @{ $self->{distributions} })[0];
}

my $machine = {
    init => [
        {
            re => qr/^\\# carton snapshot format: version (1\\.0)/,
            code => sub {
                my($stash, $snapshot, $ver) = @_;
                $snapshot->{version} = $ver;
            },
            goto => 'section',
        },
    ],
    section => [
        {
            re => qr/^DISTRIBUTIONS$/,
            goto => 'dists',
        },
        {
            re => qr/^__EOF__$/,
            done => 1,
        },
    ],
    dists => [
        {
            re => qr/^  (\\S+)$/,
            code => sub {
              $_[0]->{dist} = Carton::Dist::Tiny->new(name => "$1");
            },
            goto => 'distmeta',
        },
        {
            re => qr/^\\S/,
            goto => 'section',
            redo => 1,
        },
    ],
    distmeta => [
        {
            re => qr/^    pathname: (.*)$/,
            code => sub { $_[0]->{dist}->{pathname} = $1 },
        },
        {
            re => qr/^\\s{4}provides:$/,
            code => sub { $_[0]->{property} = 'provides' },
            goto => 'properties',
        },
        {
            re => qr/^\\s{4}requirements:$/,
            code => sub {
                $_[0]->{property} = 'requirements';
            },
            goto => 'properties',
        },
        {
            re => qr/^\\s{0,2}\\S/,
            code => sub {
                my($stash, $snapshot) = @_;
                push @{ $snapshot->{distributions} }, $stash->{dist};
                %$stash = (); # clear
            },
            goto => 'dists',
            redo => 1,
        },
    ],
    properties => [
        {
            re => qr/^\\s{6}([0-9A-Za-z_:]+) ([v0-9\\._,=\\!<>\\s]+|undef)/,
            code => sub {
                my($stash, $snapshot, $module, $version) = @_;
                if ($stash->{property} eq 'provides') {
                    $stash->{dist}->{provides}->{$module} = { version => $version };
                } else {
                    $stash->{dist}->{requirements}->{$module} = $version;
                }
            },
        },
        {
            re => qr/^\\s{0,4}\\S/,
            goto => 'distmeta',
            redo => 1,
        },
    ],
};

sub _parse {
    my ($self, $fh) = @_;

    my $state = $machine->{init};
    my $stash = {};

    LINE:
    while (my $line = readline $fh) {
        $line =~ s/\\r?\\n\\z//;

        last LINE unless @$state;

    STATE: {
            for my $trans (@{$state}) {
                if (my @match = $line =~ $trans->{re}) {
                    if (my $code = $trans->{code}) {
                        $code->($stash, $self, @match);
                    }
                    if (my $goto = $trans->{goto}) {
                        $state = $machine->{$goto};
                        if ($trans->{redo}) {
                            redo STATE;
                        } else {
                            next LINE;
                        }
                    }

                    last STATE;
                }
            }

            die "Could not parse snapshot file: $line";
        }
    }
}

package Carton::Dist::Tiny;

sub new {
    my ($class, %args) = @_;
    return bless {
        name => $args{name},
        provides => {},
        requirements => {},
    }, $class;
}
sub version_for {
    my ($self, $module) = @_;
    $self->{provides}{$module}{version};
}
sub provides { $_[0]->{provides} }
sub distfile { $_[0]->{pathname} }

1;
}
`.replace(/\s*/, '');

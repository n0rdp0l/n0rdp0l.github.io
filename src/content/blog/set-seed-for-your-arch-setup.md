---
title: "set.seed() for your Arch setup"
description: "How someone from econometrics and statistics sets up and syncs four Arch machines from one chezmoi repo."
pubDate: 2026-09-22
tags: ["arch", "chezmoi", "linux", "hyprland", "reproducibility", "parsimony"]
---

Here is the entire process for bringing up a new machine, whether laptop, desktop, or server:

<div class="n0-term">
  <div class="n0-term__bar">new machine, from a bare install</div>
  <pre><span class="n0-term__dim"># 1. authenticate, because the repo is private</span>
<span class="n0-term__prompt">$</span> gh auth login
<span></span>
<span class="n0-term__dim"># 2. restore the decryption identity from the password manager</span>
<span class="n0-term__prompt">$</span> mkdir -p ~/.config/age &amp;&amp; chmod 700 ~/.config/age
<span class="n0-term__prompt">$</span> wl-paste &gt; ~/.config/age/chezmoi-key.txt
<span class="n0-term__prompt">$</span> chmod 600 ~/.config/age/chezmoi-key.txt
<span></span>
<span class="n0-term__dim"># 3. everything else</span>
<span class="n0-term__prompt">$</span> chezmoi init -<span>-</span>apply https://github.com/n0rdp0l/dotfiles-template.git</pre>
</div>

Step three installs 71 packages, renders every config file for this specific machine, decrypts
the ssh keys, enables six systemd user services, and hands back a window manager, a bar, a
terminal, a shell and a lock screen that behave identically to the other three boxes.

Steps one and two exist only because I keep secrets in the repo. After the initial setup, if I make a change to a config file on one machine, all I need to run on the others is:
<div class="n0-term">
  <div class="n0-term__bar">other machines, after a change</div>
  <pre><span class="n0-term__prompt">$</span> chezmoi update</pre>
</div>

I want to talk about how I got here, because for a long time I assumed this kind of
setup was for people with a computer science degree or hardcore tinkerers.

## Why Arch stopped looking like a hobby

My background is econometrics and statistics. For years my mental model of Arch came mostly
from memes: people who work "I use Arch, btw" into every conversation and would rather spend a
weekend on a display server than open a laptop and do their work.

Consider what a statistician does reflexively. You write
a script. You set a seed. You pin your dependencies, because a result you cannot reproduce on a
colleague's machine is not a result, it is an anecdote. That is not tinkering for its own sake. It
is a refusal to accept state you did not create and cannot account for.

Then you go to a general-purpose operating system and accept exactly what you spent your career
refusing. Something installed a background service. A setting changed after an update. Your
machine works and you cannot say why. Arch's proposition is narrow and, from that angle, very
familiar: nothing is installed that you did not ask for, and nothing happens that is not written
down somewhere you can read. The wiki reads like a methods section. The Arch crowd even has a
name for it, K.I.S.S. (keep it simple, stupid); in statistics we'd just call it parsimony.

The open source part made it less of a leap than it sounds. If your day already runs on R and
Python you are already dependent on software maintained in public, already reading source when
the documentation is thin. Open science asks you to publish the method, not just the finding. A
machine whose entire configuration is a text file you could publish is the same commitment, one
layer down. And with all the dotfile templates floating around the internet, it really doesn't
take that much time to set up a minimal working Arch (Hyprland) setup. It's the same way you'd
copy the  headache-inducing ggplot syntax from some template and adapt it to your needs, rather than build it from the
ground up.

## The thing I did not want to give up

None of that is an argument for suffering, and I want to be honest about the other side.

Apple was good. That is, good at the thing I
needed, which was to stop thinking about the computer. Sleep worked. The trackpad worked. Fonts
were right. Moving to a new Mac was easy too: Migration Assistant carried everything across and
I was working again the same afternoon. As a scientist that matters. Every hour spent
configuring is an hour not spent on the actual question, and the honest version of the tinkerer
lifestyle involves a lot of those hours.

That convenience was exactly what I assumed Linux did not have, and it was the real reason Arch
looked daunting: the prospect of doing all of it again on the next machine, from memory, and
getting it subtly wrong; chezmoi answers that. Migration Assistant copies a machine. chezmoi
describes it, and a description can be read and fixed: a fix I work out once ends up on every
other machine by itself.

## What chezmoi actually is

[chezmoi](https://www.chezmoi.io/) manages a source directory that generates your home
directory. You never edit `~/.config/waybar/config`. You edit the source file, run
`chezmoi apply`, and chezmoi converges the target to match.

The important idea is that the source directory is not a pile of symlinks. It is a description
of a desired state, and `apply` is the function that makes reality match the description. If
you have used `renv` or a lockfile or Terraform, the shape is familiar: declare the end state,
let the tool work out the diff. One catch: it only converges what it knows about. Delete a
file from the source and chezmoi just stops managing it, the old copy stays where it was. That
is what `.chezmoiremove` is for, a short list of files to actively delete.

Day to day it is one command on each end. On the machine where I make the change,
`chezmoi edit` opens the source file, applies it when I close the editor, and commits and
pushes it. Every other machine runs `chezmoi update`, which pulls and applies. The server is
the exception: it only ever pulls, because nothing should be pushing to my repo from a box that
faces the internet.

Most of the cleverness is in file naming, which does work that would otherwise be a script.
Here is close to the whole of a barebones Hyprland setup, small enough to read in one sitting:

```text
dotfiles-template/
├── .chezmoi.toml.tmpl                   # asks the machine what it is, once, at init
├── .chezmoiignore                       # what a given host does not get
├── .chezmoidata/
│   └── packages.yaml                    # the package list, as data rather than a script
├── run_onchange_before_install-packages.sh.tmpl
│
├── dot_zshrc.tmpl                       # -> ~/.zshrc, rendered as a Go template
├── private_dot_config/                  # -> ~/.config, created mode 0700
│   ├── hypr/
│   │   ├── hyprland.conf.tmpl
│   │   ├── hypridle.conf.tmpl
│   │   └── hyprlock.conf.tmpl
│   ├── waybar/
│   │   ├── config
│   │   ├── style.css
│   │   └── scripts/
│   │       └── executable_toggle.sh     # mode 0755, no chmod anywhere
│   ├── mako/config
│   └── wofi/config
└── private_dot_local/
    └── bin/
        └── executable_brightness        # -> ~/.local/bin/brightness
```

Four prefixes carry all of that. `dot_` becomes a leading dot, because a source directory full
of real dotfiles is invisible to half the tools you would want to point at it. `private_` sets
mode 0700. `executable_` sets the executable bit. `.tmpl` marks a file as rendered rather than
copied. There is a fifth, `encrypted_`, holding age ciphertext, but the template ships none of
those, because it has no keys in it.

That is four behaviours expressed as names rather than as four lines of `chmod` in a setup
script nobody will maintain, and it is the part I find quietly excellent. The most common
reason a dotfiles repo rots is that its install script drifts from reality. chezmoi removes the
install script from the equation.

The scripts that are left follow the same rule. `run_` makes a file a script chezmoi executes, `onchange_` means
it only reruns when its contents change, and `before_` or `after_` puts it ahead of or behind
the file writes. The package list next to them in `.chezmoidata/` is not a script at all, just
YAML that every template can read.

You do not have to start from mine. The dotfiles community is unusually generous with this
sort of thing, and there are plenty of public chezmoi repos worth reading, several of them more
thorough than this one. Take whichever tree makes sense to you and delete the parts you
disagree with.

The current repo, to give a sense of scale: 107 files in the source directory, 75 of which
become managed files on a typical workstation. 18 of those are templates. 71 package names live
in YAML rather than in anybody's memory, plus a handful of Flatpaks and AUR builds. Seven
documents in `docs/`, which I will come back to.

## One repo, four machines

Four machines share this repo: two laptops, a desktop, and a small ARM server that only takes
the shell configuration. They do not share a configuration. They share a *description*, which
renders differently per machine.

The whole per-host mechanism is one lookup at init time:

```go-template
{{- $host := (output "cat" "/etc/hostname") | trim -}}
{{- $hw_type := "desktop" -}}
{{- if eq $host "laptop-1" -}}
  {{- $hw_type = "laptop" -}}
{{- else if eq $host "laptop-2" -}}
  {{- $hw_type = "laptop" -}}
{{- else if eq $host "desktop-1" -}}
  {{- $hw_type = "desktop" -}}
{{- else if eq $host "server-1" -}}
  {{- $hw_type = "server" -}}
{{- else -}}
  {{- $hw_type = promptChoice "What type of hardware are you on" (list "desktop" "laptop" "server") -}}
{{- end -}}
```

Two variables, `host` and `hardware_type`, and every difference between the machines is a guard
on one of them. An unknown machine asks rather than guessing, which is the behaviour you want
the first time you run this on hardware you have not described yet.

A guard in practice, from the lock screen config:

```go-template
{{ if eq .hardware_type "laptop" -}}
# hyprlock drives fprintd directly over D-Bus (net.reactivated.Fprint), not through
# PAM -- verified in the binary -- so this needs fprintd installed and a finger
# enrolled, and nothing at all in /etc/pam.d/hyprlock. Guarded because the desktop
# has no reader: enabling it there just makes hyprlock log "couldn't connect to
# Fprint service" on every unlock.
auth {
    fingerprint:enabled = true
}
{{ end -}}
```

The package list uses the same guard. A laptop gets `fprintd`, the desktop gets `scrcpy` for
Android work, and neither gets the other's:

```go-template
extra_packages = [
{{- if eq $hw_type "laptop" -}}
  "fprintd"
{{- else if eq $hw_type "desktop" -}}
  "scrcpy"
{{- end -}}
]
```

The hyprlock block and the package that makes it work key off the same variable, in two
different files. There is no way to install the reader driver on a machine whose lock screen
ignores it, or the reverse, because neither file is asked to remember what the other said.

## Idempotence, and scripts as a last resort

The house rule in this repo is: prefer declarative files, and only reach for a script when
nothing else converges the state.

There are eleven scripts. All eleven are `run_onchange_`. There is not a single `run_once_` in
the repo, and that is the whole discipline stated as a number. Nothing here is "install once
and hope". Every script is safe to run again, because every script *will* run again.

Making that true is less obvious than it sounds. chezmoi re-runs a `run_onchange_` script when
the rendered contents of the script file change, and it hashes nothing else. So a script that
reads your package list would never notice the package list changing. The fix is to put a hash of
the real dependency into a comment:

```go-template
# Combined package list hash: {{ (concat .packages.arch .extra_packages) | join " " | sha256sum }}
```

The comment changes when the package list changes, so the file changes, so the script fires.
Add a package to a YAML file and the installer re-runs on every machine at the next apply. Edit a
comment in that YAML file and nothing happens, because the hash is over the joined package names
rather than the file. That is the difference between a trigger and a correct trigger.

The prettier version of the same trick discovers its own dependencies instead of naming them:

```go-template
{{ range (glob (joinPath .chezmoi.sourceDir "private_dot_local/share/applications/*.desktop")) -}}
# {{ base . }}: {{ include . | sha256sum }}
{{ end }}
```

Drop a new `.desktop` file into that directory and the MIME index rebuilds itself, with no edit
to the script that rebuilds it. The dependency list cannot go stale because nobody maintains it.

One more, because it is the decision I am most pleased with. The package installer runs `-S`,
deliberately not `-Syu`:

> A chezmoi apply converges declared state; it is not a system upgrader.

That sentence is doing real work. The temptation is to make `apply` also update the system,
since you are already there and the package manager is already open. Resist it. An apply that upgrades is
an apply you become afraid to run, and a convergence tool you are afraid to run has stopped
converging anything. Upgrades are a separate verb, run deliberately, by me.

## Secrets, and the one circle you cannot script

The ssh keys live in the repo, encrypted with [age](https://age-encryption.org/). The public
recipient is committed. The identity that decrypts them is not, and never will be. It sits in
`~/.config/age/`, unmanaged on purpose and explicitly ignored, so that `chezmoi add` refuses it
outright rather than relying on me never trying. A committed identity would make the encryption
decorative.

Which leaves exactly one thing that cannot be automated, and it is a genuine circularity: the
key that would authenticate the clone is inside the clone. No script in the repo can fix this,
because the script would arrive with the clone that needs the credentials. Somebody has to paste
something by hand, once per machine.

I like this constraint, because it is honest about where the boundary is. As the repo's own
notes put it:

> Step 1 is the part most write-ups of this setup omit, because they assume a public repo.

Three steps, and two of them are the bootstrap secret. The headless server differs slightly.
With no clipboard over ssh, the identity arrives by `scp` from a machine that already has it,
but the shape is the same. One manual act, then convergence.

## Leaving room for agents

Every so often something gets promoted from tool to operating system. The current pitch is a
computer that runs itself, and it sits awkwardly against everything above.

So I will describe what I actually use.

There is a `CLAUDE.md` in the repo: facts about this setup, one line per rule, the things that
are easy to get wrong. It is not a personality. It is a README that happens to have a machine as
its primary reader. The version that deploys to every host is four lines long, and the most
useful thing in it is "never edit `~/.config` directly."

The other half is a `PreToolUse` hook, thirty lines of bash, a `case` statement:

```bash
case "$f" in
    */executable_brightness|*/monitors-lib.sh)   doc=docs/brightness.md ;;
    */hypr/scripts/*|*/hyprland.lua*)            doc=docs/hyprland.md ;;
    *) exit 0 ;;
esac
```

When an edit targets a file whose subsystem has a deep-dive document, it injects that path into
context before the edit happens. It is silent for most files, it cannot block an edit, and it
exists because a pointer written in prose is only a suggestion. That is the entire agentic layer.

The part that actually matters is the thing it points at. `docs/` is 1,217 lines across seven
files, and they exist because debugging *with* a model produced write-ups worth keeping: why
the camera has 32 device nodes that are all dead, why a particular command fails on stdout while
returning success. Against roughly 2,400 lines of shell and templates, that is about one line of
recorded reasoning per 1.7 lines of code. Those documents are not agent infrastructure. They are
the lab notebook, and they would be worth having if I never ran a model again.

There is a second-order benefit I did not anticipate, and it runs back to the convenience
argument. A model that can read the actual state of a machine, the configs, the unit files, the
journal, is genuinely good at debugging and at planning a change before making it. That part of
the hype is real. It is also downstream of everything else here: it works because the machine is
described in files rather than buried in settings panels.

None of this ships enabled. It is a file and a hook in a repo that works identically without
them, which is the only arrangement I trust: the agent gets context, not authority.

Between a template you can clone and a model that can read what it produced, the gap back to the
Mac I left is more or less closed, no omarchy needed ;).

## Three steps

The honest summary is that almost none of this is about Linux. Declare the end state. Make every
step rerunnable. Write down why, next to the thing it explains. Keep the one manual step manual,
and be clear about why it cannot be automated.

That is the same discipline as a reproducible analysis, pointed at a laptop instead of a dataset.
Coming from statistics did not make it harder to learn. It is most of what I already did.

The barebones version (the structure, the scripts, the templating, none of my keys) is at
[github.com/n0rdp0l/dotfiles-template](https://github.com/n0rdp0l/dotfiles-template). Clone it,
delete the half you disagree with, and see how few steps you can get it down to.

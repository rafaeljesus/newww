# npm style guide

This guide describes the CSS conventions used on
[npmjs.com](https://npmjs.com). It was inspired by a [great blog post about desiging
medium.com](https://medium.com/@fat/mediums-css-is-actually-pretty-fucking-good-b8e2a6c78b06).
Unlike Medium, our stylesheets are written in
[Stylus](http://learnboost.github.io/stylus/) rather than
[Less](http://lesscss.org/).  

## Naming Conventions

Classes and IDs are lowercase with words separated by a dash:

```css
/* good */
.user-profile {}
.post-header {}
#top-navigation {}

/* bad */
.userProfile {}
.postheader {}
#top_navigation {}
```

Image file names are lowercase with words separated by a dash:

```sh
# good
icon-home.png

# bad
iconHome.png
icon_home.png
iconhome.png
```

Image file names are prefixed with their usage.

```sh
# good
icon-home.png
bg-container.jpg
bg-home.jpg
sprite-top-navigation.png

#bad
home-icon.png
container-background.jpg
bg.jpg
top-navigation.png
```

## IDs vs. Classes

You should almost never need to use IDs. Broken behavior due to ID
collisions are hard to track down and annoying.

## Color

When styling things, only use the color variables provided by
[variables.styl](/variables.styl). When adding a color variable, using RGB
and RGBA color units are preferred over hex, named, HSL, or HSLA values.

```css
/* good */
rgb(50, 50, 50);
rgba(50, 50, 50, 0.2);
rgba(black, 0.2);
rgba(white, 0.2);

/* bad */
#FFF;
#FFFFFF;
hsl(120, 100%, 50%);
hsla(120, 100%, 50%, 1);
```

## z-index scale

Please use the z-index scale defined in [z-index.styl](/z-index.styl).

## Fonts

With the additional support of web fonts `font-weight` plays a more
important role than it once did. Different font weights will render
typefaces specifically created for that weight, unlike the old days where
`bold` could be just an algorithm to fatten a typeface. npm uses the
numerical value of `font-weight` to enable the best representation of a
typeface.

Refer to [typography.styl](/typography.styl) for type size, letter-spacing, and line height. Raw
sizes, spaces, and line heights should be avoided outside of
[typography.styl](/typography.styl).

See [font-weight on MDN](https://developer.mozilla.org/en/CSS/font-weight) for further
reading.

## Componentizing

Always look to abstract components. The reuse of components across designs helps to improve
this consistency at an implementation level.

A name like `.homepage-nav` limits its use. Instead think about writing
styles in such a way that they can be reused in other parts of the app.
Instead of `.homepage-nav`, try instead `.nav` or `.nav-bar`. Ask yourself
if this component could be reused in another context (chances are it
could!).

Components should belong to their own file. For example, all general
button definitions should belong in buttons.styl.

## Namespacing

Namespacing is great! But it should be done at a component level – never at
a page level.

Also, namespacing should be made at a descriptive, functional level. Not at
a page location level. For example, `.profile-header` could become
`.header-hero-unit`.

```css
/* good*/
.nav, .nav-bar, .nav-list {}

/* bad */
.nav, .home-nav, .profile-nav {}
```

## Style Scoping

Pages should largely be reusing the general component level styles
defined above. Page level namespaces however can be helpful for overriding
generic components in very specific contexts.

Page level overrides should be minimal and under a single page level class
nest.

```stylus
.home-page
  .nav
    margin-top 10px
```

## Nesting

Nesting makes it harder to tell at a glance where css selector optimizations can be made.

```css
/* good */
.list-btn .btn-inner {
  background: red;
}
.list-btn .btn-inner:hover {
  .opacity(.4);
}

/* bad */
.list-btn {
  .list-btn-inner {
    .btn {
      background: red;
    }
    .btn:hover {
      .opacity(.4);
    }
  }
}

```

## Comments

Be wary of comments. They may be a sign of unnecessary complexity.

## Quotes

While quotes for URLs and multi-word font names are optional in CSS, we find quotes to be
visually clearer. Please use double quotes instead of single quotes.

```css
/* good */
{
  background-image: url("/img/you.jpg");
  font-family: "Helvetica Neue Light", "Helvetica Neue", Helvetica, Arial;
}

/* bad */
{
  background-image: url(/img/you.jpg);
  font-family: Helvetica Neue Light, Helvetica Neue, Helvetica, Arial;
}

/* bad */
{
  background-image: url('/img/you.jpg');
  font-family: 'Helvetica Neue Light', 'Helvetica Neue', Helvetica, Arial;
}
```

## Vendor Prefixes

We don't have to think about vendor prefixes, because they're applied
automatically by [nib](http://tj.github.io/nib/).  

## Performance

### Specificity

Although in the name (cascading style sheets), cascading can introduce
unnecessary performance overhead for applying styles. Take the following
example:

```css
ul.user-list li span a:hover { color: red; }
```

Styles are resolved during the renderer's layout pass. The selectors are
resolved right to left, exiting when it has been detected the selector does
not match. Therefore, in this example every `a` tag has to be inspected to see
if it resides inside a `span` and a `li`. As you can imagine, this requires a
lot of DOM walking which, for large documents, can cause a significant
increase in layout time.

If we know we want to give all `a` elements inside the `.user-list` red on
hover we can simplify this style to:

```stylus
.user-list a:hover
  color: red
```

If we want to only style specific `a` elements inside `.user-list` we can
give them a specific class:

```stylus
.user-list .link-primary:hover
  color: red
```

### Use @extend instead of mixins

Extending is feature common to LESS, Sass, and Stylus. It allows you to
share styles between selectors without generating duplicate CSS. Go read
[The Extend Concept](http://css-tricks.com/the-extend-concept/) on CSS
Tricks, and the [Stylus docs on
@extend](http://learnboost.github.io/stylus/docs/extend.html).

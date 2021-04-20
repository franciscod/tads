export function titleSlug(s: string): string {
    s = s.replace(/•/g, "");
    s = s.replace(/α/g, "alpha");
    s = s.replace(/¬/g, "neg");
    s = s.replace(/∨/g, "or");
    s = s.replace(/∧/g, "and");
    s = s.replace(/⇒/g, "imp");
    s = s.replace(/=/g, "eq");
    s = s.replace(/\?/g, "q");
    s = s.replace(/\+/g, "plus");
    s = s.replace(/\-/g, "minus");
    s = s.replace(/×/g, "times");
    s = s.replace(/</g, "lt");
    s = s.replace(/≤/g, "le");

    s = s.replace(/#/g, "hash");
    s = s.replace(/\|/g, "pipe");
    s = s.replace(/{/g, "lbrace");
    s = s.replace(/}/g, "rbrace");
    s = s.replace(/∅/g, "empty");
    s = s.replace(/−/g, "bigminus");
    s = s.replace(/∩/g, "cap");
    s = s.replace(/∪/g, "cup");
    s = s.replace(/⊆/g, "contains");
    s = s.replace(/∈/g, "in");

    return s[0].toUpperCase() + s.substr(1).toLowerCase();
}

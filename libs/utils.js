function getAllAuthorsAndOutputAddresses(objUnit) {
    const arrAuthorAddresses = objUnit.authors.map(function (author) {
        return author.address;
    });
    if (!objUnit.messages) // voided unit
        return null;
    const arrOutputAddresses = [];
    const arrBaseAAAddresses = [];
    for (let i = 0; i < objUnit.messages.length; i++) {
        const message = objUnit.messages[i];
        const payload = message.payload;
        if (message.app === "payment" && payload) {
            for (let j = 0; j < payload.outputs.length; j++) {
                const address = payload.outputs[j].address;
                if (arrOutputAddresses.indexOf(address) === -1)
                    arrOutputAddresses.push(address);
            }
        } else if (message.app === 'definition' && payload.definition[1].base_aa)
            arrBaseAAAddresses.push(payload.definition[1].base_aa);
    }
    const arrAddresses = [...new Set(arrAuthorAddresses.concat(arrOutputAddresses, arrBaseAAAddresses))];
    return {
        author_addresses: arrAuthorAddresses,
        output_addresses: arrOutputAddresses,
        base_aa_addresses: arrBaseAAAddresses,
        addresses: arrAddresses,
    };
}

module.exports = {
    getAllAuthorsAndOutputAddresses
}

let handle = (time, doaction) => {
    return new Promise((res, rej) => {
        setTimeout(() => {
            console.log(doaction)
            res()
        }, time)
    })
}
let main = async () => {
    await handle(1000, "Eat")
    await handle(1000, "sleep")
    await handle(1000, "game")
}
main()
